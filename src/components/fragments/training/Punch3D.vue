<script setup>
import {inject, onBeforeUnmount, onMounted, ref} from 'vue';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


import punchTexture from '@/assets/textures/punch_texture2.webp';
import {DRACOLoader} from "three/addons";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

const loading = ref(true);

const props = defineProps({
  width: {
    type: Number,
    default: 250
  },
  height: {
    type: Number,
    default: 330
  }
});

const AmmoLib = inject('AmmoLib');
let Ammo = null;
const target = ref();
let collisionConfiguration, dispatcher, broadphase, solver, softBodySolver;

// Graphics variables
let camera, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();
let clickRequest = false;
const mouseCoords = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

// Physics variables
const gravityConstant = -9.8;
let physicsWorld;
const softBodies = [];
const margin = 0.05;
let softBodyHelpers;

let sphereMesh;


function initGraphics() {

  camera = new THREE.PerspectiveCamera(
      45,
      props.width / props.height,
      0.1,
      100
  );
  camera.position.set(5, 0, 0);  // Камера сбоку по оси X

  scene = new THREE.Scene();
  scene.background = null;

  renderer = new THREE.WebGLRenderer({antialias: false, alpha: true});
  //renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)) // Low quality
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(props.width, props.height);
  renderer.setAnimationLoop(render);

  renderer.shadowMap.enabled = false;
  //renderer.shadowMap.enabled = true; // High quality
 //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0); // прозрачный фон


  textureLoader = new THREE.TextureLoader();

  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 10);
  light.position.set(20, 10, -40);

  scene.add(light);

  window.addEventListener('resize', onWindowResize);
}

function initPhysics() {

  // Physics configuration
  collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  softBodySolver = new Ammo.btDefaultSoftBodySolver();
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
  physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
  physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

  softBodyHelpers = new Ammo.btSoftBodyHelpers();

}

import punchModel from '@/assets/models/punching-bags.gltf';

function createGLTF() {
  const loader = new GLTFLoader();

  const dracoLoader = new DRACOLoader();
  //dracoLoader.setDecoderPath('/jsm/draco/');
  loader.setDRACOLoader(dracoLoader);

  loader.load(punchModel, function (gltf) {

    const geometry = gltf.scene.children[0].children[0].geometry;

    // Загрузка текстуры
    const material = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
    });

    textureLoader.load(punchTexture, function (texture) {
      texture.minFilter = THREE.LinearFilter; // Более простой фильтр для низкого разрешения
      texture.magFilter = THREE.LinearFilter; // Уменьшаем фильтрацию текстур

      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2); // Устанавливаем масштаб повторения

      // Поворот текстуры на 90 градусов
      texture.rotation = 80;

      // Устанавливаем точку вращения в центр текстуры
      texture.center.set(0.6, 1);

      // Для отзеркаливания по горизонтали
      texture.repeat.x = -1;

      texture.offset.set(0.8, 0.9);

      material.map = texture;
      material.needsUpdate = true;

      target.value.appendChild(renderer.domElement);
    });

    sphereMesh = createSoftVolume(geometry, material);
    sphereMesh.rotation.y = 1.2;

    // Положение объекта
    const objectPosition = new THREE.Vector3(sphereMesh.position.x, sphereMesh.position.y + 1.2, sphereMesh.position.z);

// Установка позиции камеры ровно сбоку (слева или справа от объекта)
    const cameraDistance = 4.1; // Расстояние камеры от объекта по оси X
    camera.position.set(objectPosition.x + cameraDistance, objectPosition.y, objectPosition.z); // Камера справа от объекта

// Направление камеры
    camera.lookAt(objectPosition);

    loading.value = false;



  }, undefined, function (error) {
    console.error('Ошибка при загрузке модели:', error);
  });

}

function applyForceToSphere() {

  if (clickRequest && sphereMesh) {

    raycaster.setFromCamera(mouseCoords, camera);

    const intersects = raycaster.intersectObject(sphereMesh);

    if (intersects.length > 0) {
      // Точка пересечения в мировых координатах
      const intersectPoint = intersects[0].point.clone();

      // Преобразуем точку пересечения в локальные координаты объекта
      sphereMesh.worldToLocal(intersectPoint);

      // Теперь можно работать с координатами узлов в локальной системе отсчета
      const sphereBody = sphereMesh.userData.physicsBody;
      const nodes = sphereBody.get_m_nodes();

      for (let i = 0; i < nodes.size(); i++) {
        const node = nodes.at(i);
        const nodePos = node.get_m_x();

        // Вычисляем расстояние между узлом и точкой клика (уже в локальных координатах)
        const distance = Math.sqrt(
            Math.pow(nodePos.x() - intersectPoint.x, 2) +
            Math.pow(nodePos.y() - intersectPoint.y, 2) +
            Math.pow(nodePos.z() - intersectPoint.z, 2)
        );

        // Если узел достаточно близко к точке клика, перемещаем его
        if (distance < 0.9) { // радиус действия удара
          const forceDirection = new Ammo.btVector3(
              nodePos.x() - intersectPoint.x,
              nodePos.y() - intersectPoint.y,
              nodePos.z() - intersectPoint.z
          );
          forceDirection.normalize();
          forceDirection.op_mul(0.07); // мощность удара

          nodePos.op_add(forceDirection);
        }
      }

      // Отталкиваем грушу назад путем смещения узлов с массой
      const impulseDirection = new Ammo.btVector3(
          intersectPoint.x - sphereBody.get_m_nodes().at(0).get_m_x().x(),
          intersectPoint.y - sphereBody.get_m_nodes().at(0).get_m_x().y(),
          intersectPoint.z - sphereBody.get_m_nodes().at(0).get_m_x().z()
      );
      impulseDirection.normalize();
      impulseDirection.op_mul(-0.07); // небольшое смещение для отталкивания

      for (let i = 0; i < nodes.size(); i++) {
        const node = nodes.at(i);
        if (node.get_m_im() > 0) {
          node.get_m_x().op_add(impulseDirection);
        }
      }

      Ammo.destroy(impulseDirection);
    }

    clickRequest = false;
  }
}


function createObjects() {
  createGLTF();
}

function processGeometry(bufGeometry) {

  // Ony consider the position values when merging the vertices
  const posOnlyBufGeometry = new THREE.BufferGeometry();
  posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'));
  posOnlyBufGeometry.setIndex(bufGeometry.getIndex());

  // Merge the vertices so the triangle soup is converted to indexed triangles
  const indexedBufferGeom = BufferGeometryUtils.mergeVertices(posOnlyBufGeometry);

  // Create index arrays mapping the indexed vertices to bufGeometry vertices
  mapIndices(bufGeometry, indexedBufferGeom);

}

function isEqual(x1, y1, z1, x2, y2, z2) {

  const delta = 0.000001;
  return Math.abs(x2 - x1) < delta &&
      Math.abs(y2 - y1) < delta &&
      Math.abs(z2 - z1) < delta;

}

function mapIndices(bufGeometry, indexedBufferGeom) {

  // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

  const vertices = bufGeometry.attributes.position.array;
  const idxVertices = indexedBufferGeom.attributes.position.array;
  const indices = indexedBufferGeom.index.array;

  const numIdxVertices = idxVertices.length / 3;
  const numVertices = vertices.length / 3;

  bufGeometry.ammoVertices = idxVertices;
  bufGeometry.ammoIndices = indices;
  bufGeometry.ammoIndexAssociation = [];

  for (let i = 0; i < numIdxVertices; i++) {

    const association = [];
    bufGeometry.ammoIndexAssociation.push(association);

    const i3 = i * 3;

    for (let j = 0; j < numVertices; j++) {

      const j3 = j * 3;
      if (isEqual(idxVertices[i3], idxVertices[i3 + 1], idxVertices[i3 + 2],
          vertices[j3], vertices[j3 + 1], vertices[j3 + 2])) {

        association.push(j3);

      }

    }

  }

}

function createSoftVolume(bufferGeom, material) {
  processGeometry(bufferGeom);

  const volume = new THREE.Mesh(bufferGeom, material);
  volume.castShadow = true;
  volume.receiveShadow = true;
  scene.add(volume);

  const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      physicsWorld.getWorldInfo(),
      bufferGeom.ammoVertices,
      bufferGeom.ammoIndices,
      bufferGeom.ammoIndices.length / 3,
      true
  );

  const sbConfig = volumeSoftBody.get_m_cfg();
  sbConfig.set_viterations(20);
  sbConfig.set_piterations(20);

  //sbConfig.set_kVC(0.1);  // Фактор сохранения объема
  //sbConfig.set_kVCF(0.1);  // Фактор сохранения объема
  //sbConfig.set_kSRHR_CL(1);  // Жесткость при контакте с жёсткими телами
  //sbConfig.set_kSR_SPLT_CL(1);  // Разделение мягких и жёстких тел при контакте
  //sbConfig.set_kDF(0.1);  // Фактор трения
  sbConfig.set_kDP(0.05);  // Коэффициент демпфирования

  sbConfig.set_kPR(1000);  // Внутреннее давление, очень низкое, чтобы избежать деформаций

  // Soft-soft and soft-rigid collisions
  //sbConfig.set_collisions(0x11);

  // Stiffness
  //volumeSoftBody.get_m_materials().at(0).set_m_kLST(1);
  //volumeSoftBody.get_m_materials().at(0).set_m_kAST(1);

  volumeSoftBody.setTotalMass(100, false);

  // Set node masses to zero to immobilize
  const nodes = volumeSoftBody.get_m_nodes();
  // Находим верхние ноды
  const topNodes = findTopNodes(nodes);

  // Set node masses to zero to immobilize
  for (let i = 0; i < nodes.size(); i++) {
    const node = nodes.at(i);
    if (topNodes.includes(node)) {
      node.set_m_im(0);
    } else {
      node.set_m_im(25);
    }
  }

  Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin);
  physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
  volume.userData.physicsBody = volumeSoftBody;
  volumeSoftBody.setActivationState(4); // Disable deactivation

  softBodies.push(volume);

  return volume;
}

function handlePointerDown(event) {
  if (!clickRequest) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseCoords.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    clickRequest = true;
  }
}

function initInput() {

  window.addEventListener('pointerdown', handlePointerDown);
}

function onWindowResize() {
  camera.aspect = props.width / props.height;
  camera.updateProjectionMatrix();

  renderer.setSize(props.width, props.height);
}

function updatePhysics(deltaTime) {
  const fixedTimeStep = 1 / 60;  // Устанавливаем шаг физической симуляции на 60 FPS
  const maxSubSteps = 5;  // Максимальное количество подшагов

  physicsWorld.stepSimulation(deltaTime, maxSubSteps, fixedTimeStep);

  // Step world
//  physicsWorld.stepSimulation(deltaTime, 10);

  // Update soft volumes
  for (let i = 0, il = softBodies.length; i < il; i++) {

    const volume = softBodies[i];
    const geometry = volume.geometry;
    const softBody = volume.userData.physicsBody;
    const volumePositions = geometry.attributes.position.array;
    const volumeNormals = geometry.attributes.normal.array;
    const association = geometry.ammoIndexAssociation;
    const numVerts = association.length;
    const nodes = softBody.get_m_nodes();
    for (let j = 0; j < numVerts; j++) {

      const node = nodes.at(j);
      const nodePos = node.get_m_x();
      const x = nodePos.x();
      const y = nodePos.y();
      const z = nodePos.z();
      const nodeNormal = node.get_m_n();
      const nx = nodeNormal.x();
      const ny = nodeNormal.y();
      const nz = nodeNormal.z();

      const assocVertex = association[j];

      for (let k = 0, kl = assocVertex.length; k < kl; k++) {

        let indexVertex = assocVertex[k];
        volumePositions[indexVertex] = x;
        volumeNormals[indexVertex] = nx;
        indexVertex++;
        volumePositions[indexVertex] = y;
        volumeNormals[indexVertex] = ny;
        indexVertex++;
        volumePositions[indexVertex] = z;
        volumeNormals[indexVertex] = nz;

      }

    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

  }

}

function findTopNodes(nodes) {
  let maxY = -Infinity;
  let topNodes = [];

  // Найдем максимальное значение Y
  for (let i = 0; i < nodes.size(); i++) {
    const nodePos = nodes.at(i).get_m_x();
    if (nodePos.y() > maxY) {
      maxY = nodePos.y();
    }
  }

  // Теперь найдем все ноды с этим максимальным Y
  for (let i = 0; i < nodes.size(); i++) {
    const nodePos = nodes.at(i).get_m_x();
    if (Math.abs(nodePos.y() - maxY) < 0.01) {  // Можно использовать небольшой допуск
      topNodes.push(nodes.at(i));
    }
  }

  return topNodes;
}

function init() {
  initPhysics();
  initGraphics();
  createObjects();
  initInput();
}

function render() {

  const deltaTime = clock.getDelta();

  updatePhysics(deltaTime);

  applyForceToSphere();

  renderer.render(scene, camera);

}

onMounted(async () => {
  AmmoLib.then(function (AmmoLib) {
    Ammo = AmmoLib
    init();
  });
});

onBeforeUnmount(() => {
  // Удаляем все мягкие тела
  softBodies.forEach(body => {
    physicsWorld.removeSoftBody(body.userData.physicsBody);
    Ammo.destroy(body.userData.physicsBody);
  });

  softBodies.length = 0;

  if (sphereMesh) {
    sphereMesh.geometry.dispose();
    sphereMesh.material.dispose();
    scene.remove(sphereMesh);
    sphereMesh = null;
  }

  // Удаляем физический мир
  if (physicsWorld) {
    Ammo.destroy(physicsWorld);
    physicsWorld = null;
  }

  // Удаляем все связанные объекты Ammo
  if (softBodyHelpers) {
    Ammo.destroy(softBodyHelpers);
    softBodyHelpers = null;
  }

  // Удаление всех созданных объектов Ammo.js
  if (collisionConfiguration) {
    Ammo.destroy(collisionConfiguration);
    collisionConfiguration = null;
  }
  if (dispatcher) {
    Ammo.destroy(dispatcher);
    dispatcher = null;
  }
  if (broadphase) {
    Ammo.destroy(broadphase);
    broadphase = null;
  }
  if (solver) {
    Ammo.destroy(solver);
    solver = null;
  }
  if (softBodySolver) {
    Ammo.destroy(softBodySolver);
    softBodySolver = null;
  }

  if (raycaster) {
    raycaster = null;
  }


  if (renderer) {
    if (target.value) {
      target.value.removeChild(renderer.domElement);
    }

    renderer.forceContextLoss();
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer = null;
  }

  if (scene) {
    scene.clear();
    scene = null;
  }

  if (camera) {
    camera = null;
  }

  if (textureLoader) {
    textureLoader = null;
  }

  window.removeEventListener('pointerdown', handlePointerDown);

  // Удаление обработчиков событий
  window.removeEventListener('resize', onWindowResize);

  Ammo = null;


});

</script>

<template>
  <div ref="target" :style="{ width: `${props.width}px`, height: `${props.height}px` }"></div>
</template>

<style>

</style>
