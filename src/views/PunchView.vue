<script setup>
import {inject, onMounted, onUnmounted, ref} from 'vue';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


const AmmoLib = inject('AmmoLib');
let Ammo;
const target = ref();


// Graphics variables
let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();
let clickRequest = false;
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({color: 0x202020});
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();

// Physics variables
const gravityConstant = -9.8;
let physicsWorld;
const rigidBodies = [];
const softBodies = [];
const margin = 0.05;
let transformAux1;
let softBodyHelpers;
let rope;



function initGraphics() {

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  camera.position.set(-7, 5, 8);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  target.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  textureLoader = new THREE.TextureLoader();

  const ambientLight = new THREE.AmbientLight(0xbbbbbb);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-10, 10, 5);
  light.castShadow = true;
  const d = 20;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.width = 4096;
  light.shadow.mapSize.height = 4096;

  scene.add(light);

  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.top = '0px';
  // container.appendChild( stats.domElement );


  window.addEventListener('resize', onWindowResize);

}

function initPhysics() {

  // Physics configuration

  const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  const softBodySolver = new Ammo.btDefaultSoftBodySolver();
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
  physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
  physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
  softBodyHelpers = new Ammo.btSoftBodyHelpers();

}

function createObjects() {

  // Ground
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);
   const ground = createParalellepiped(40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial({color: 0xFFFFFF}));
  ground.castShadow = true;
  ground.receiveShadow = true;
  textureLoader.load('textures/grid.png', function (texture) {

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40);
    ground.material.map = texture;
    ground.material.needsUpdate = true;

  });

  // Create soft volumes
  const volumeMass = 15;
  const sphereGeometry = new THREE.SphereGeometry(1.5, 80, 50);
  sphereGeometry.translate(-1, 5, 0);
  let sphereMesh = createSoftVolume(sphereGeometry, volumeMass, 1000);

  sphereMesh.userData.physicsBody.setFriction( 0.5 );


  // Ball
  const ballMass = 1.2;
  const ballRadius = 0.6;

  const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 20, 20 ), new THREE.MeshPhongMaterial( { color: 0x202020 } ) );
  ball.castShadow = true;
  ball.receiveShadow = true;
  const ballShape = new Ammo.btSphereShape( ballRadius );
  ballShape.setMargin( margin );
  pos.set( - 3, 2, 0 );
  quat.set( 0, 0, 0, 1 );
  createRigidBody( ball, ballShape, ballMass, pos, quat );
  ball.userData.physicsBody.setFriction( 0.5 );

  // The rope
  // Rope graphic object
  const ropeNumSegments = 5;
  const ropeLength = 1;
  const ropeMass = 3;
  const ropePos = ball.position.clone(); //new THREE.Vector3(0, 3, 0);
  ropePos.y += 1.2; // Ball radius

  const segmentLength = ropeLength / ropeNumSegments;
  const ropeGeometry = new THREE.BufferGeometry();
  const ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
  const ropePositions = [];
  const ropeIndices = [];

  for ( let i = 0; i < ropeNumSegments + 1; i ++ ) {
    ropePositions.push( ropePos.x, ropePos.y - i * segmentLength, ropePos.z );
  }

  for ( let i = 0; i < ropeNumSegments; i ++ ) {
    ropeIndices.push( i, i + 1 );
  }

  ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
  ropeGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
  ropeGeometry.computeBoundingSphere();
  rope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
  rope.castShadow = true;
  rope.receiveShadow = true;
  scene.add( rope );

  // Rope physic object
  const softBodyHelpers = new Ammo.btSoftBodyHelpers();
  const ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
  const ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y - ropeLength, ropePos.z );
  const ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
  const sbConfig = ropeSoftBody.get_m_cfg();
  sbConfig.set_viterations( 10 );
  sbConfig.set_piterations( 10 );
  ropeSoftBody.setTotalMass( ropeMass, false );
  Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
  physicsWorld.addSoftBody( ropeSoftBody, 1, - 1 );
  rope.userData.physicsBody = ropeSoftBody;
  // Disable deactivation
  ropeSoftBody.setActivationState( 4 );

  //
  // const boxGeometry = new THREE.BoxGeometry(1, 1, 5, 4, 4, 20);
  // boxGeometry.translate(-5, 5, 0);
  // createSoftVolume(boxGeometry, volumeMass, 120);

  // Создание невидимого якоря
  const anchorPos = new THREE.Vector3(ropePos.x, ropePos.y, ropePos.z);
  const anchorGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const anchorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, visible: true }); // Невидимый материал
  const anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
  anchorMesh.position.copy(anchorPos);
  scene.add(anchorMesh);

  const anchorShape = new Ammo.btBoxShape(new Ammo.btVector3(0.05, 0.05, 0.05));
  const anchorBody = createRigidBody(anchorMesh, anchorShape, 0, anchorPos, quat); // Масса 0 для неподвижного объекта

  // Привязка концов веревки к шару и якорю
  const influence = 1;
  ropeSoftBody.appendAnchor(0, anchorBody, true, influence);
  ropeSoftBody.appendAnchor(ropeNumSegments, ball.userData.physicsBody, true, influence);

  // Привязка конца веревки к мягкому шару
 // ropeSoftBody.userData.physicsBody.appendAnchor(ropeNumSegments, sphereMesh.userData.physicsBody, true, 1);


}


function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

  const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(margin);

  createRigidBody(threeObject, shape, mass, pos, quat);

  return threeObject;

}

function createRigidBody(threeObject, physicsShape, mass, pos, quat) {

  threeObject.position.copy(pos);
  threeObject.quaternion.copy(quat);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
  const body = new Ammo.btRigidBody(rbInfo);

  threeObject.userData.physicsBody = body;

  scene.add(threeObject);

  if (mass > 0) {

    rigidBodies.push(threeObject);

    // Disable deactivation
    body.setActivationState(4);

  }

  physicsWorld.addRigidBody(body);

  return body;

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


function createSoftVolume(bufferGeom, mass, pressure) {

  processGeometry(bufferGeom);

  const volume = new THREE.Mesh(bufferGeom, new THREE.MeshPhongMaterial({color: 0xFFFFFF}));
  volume.castShadow = true;
  volume.receiveShadow = true;
  volume.frustumCulled = false;
  scene.add(volume);

  textureLoader.load('textures/colors.png', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    volume.material.map = texture;
    volume.material.needsUpdate = true;

  });

  // Volume physic object

  const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      physicsWorld.getWorldInfo(),
      bufferGeom.ammoVertices,
      bufferGeom.ammoIndices,
      bufferGeom.ammoIndices.length / 3,
      true);

  const sbConfig = volumeSoftBody.get_m_cfg();
  sbConfig.set_viterations(40);
  sbConfig.set_piterations(40);

  // Soft-soft and soft-rigid collisions
  sbConfig.set_collisions(0x11);

  // Friction
  sbConfig.set_kDF(0.1);
  // Damping
  sbConfig.set_kDP(0.01);
  // Pressure
  sbConfig.set_kPR(pressure);
  // Stiffness
  volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
  volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9);

  volumeSoftBody.setTotalMass(mass, false);
  Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin);
  physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
  volume.userData.physicsBody = volumeSoftBody;
  // Disable deactivation
  volumeSoftBody.setActivationState(4);

  softBodies.push(volume);

  return volume;

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function updatePhysics(deltaTime) {

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

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

  // Update rigid bodies
  for (let i = 0, il = rigidBodies.length; i < il; i++) {

    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();
    if (ms) {

      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

    }

  }

  // Update rope
  const softBody = rope.userData.physicsBody;
  const ropePositions = rope.geometry.attributes.position.array;
  const numVerts = ropePositions.length / 3;
  const nodes = softBody.get_m_nodes();
  let indexFloat = 0;

  for ( let i = 0; i < numVerts; i ++ ) {

    const node = nodes.at( i );
    const nodePos = node.get_m_x();
    ropePositions[ indexFloat ++ ] = nodePos.x();
    ropePositions[ indexFloat ++ ] = nodePos.y();
    ropePositions[ indexFloat ++ ] = nodePos.z();

  }

  rope.geometry.attributes.position.needsUpdate = true;


}

function init() {

  initGraphics();

  initPhysics();

  createObjects();

  // initInput();

}


function animate() {

  render();

}

function render() {

  const deltaTime = clock.getDelta();

  updatePhysics(deltaTime);

  // processClick();

  renderer.render(scene, camera);

}

onMounted(() => {


  AmmoLib.then(function (AmmoLib) {

    Ammo = AmmoLib
    console.log("ammo loaded " + Ammo)

    init();


  });


});


onUnmounted(() => {

});

</script>

<template>
  <div ref="target"></div>
</template>

<style>

</style>
