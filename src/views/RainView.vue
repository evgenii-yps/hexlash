<template>

  <div id="sketch"></div>

  <div class="foreground">
    <keep-alive>
      <transition name="explode" mode="out-in">
        <component v-if="!isAuthenticated" :is="currentComponent" :key="currentComponentKey"/>
      </transition>
    </keep-alive>


    <div v-if="countdownText.length > 0 && isAuthenticated" class="timer-listing-container">

      <div class="timer-overlay">
        {{ countdownText }}
      </div>
      <div class="timer-text"></div>
      <div class="text-pages-link">
        <a v-ripple class="btn-text-page" @click="goTo('rules')">Rules</a>
        <a v-ripple class="btn-text-page" @click="goTo('help')">Help</a>
      </div>
    </div>

    <p v-if="!isAuthenticated" class="beta-text">{{ version }}</p>


    <Getstarted v-if="isAuthenticated && !initialVerified"/>

  </div>


</template>

<script setup>
import {useRoute} from "vue-router";
import Login from "@/components/fragments/auth/Login.vue";
import Invite from "@/components/fragments/auth/Invite.vue";
import Reset from "@/components/fragments/auth/Reset.vue";
import TelegramLogin from "@/components/fragments/auth/TelegramLogin.vue";

const {t} = useI18n({useScope: 'global'})

const isAuthenticated = computed(() => store.getters["master/getLoginState"].isAuthenticated);
const initialVerified = computed(() => {
  const master = store.getters['master/getMaster'];
  if (master && master.initialVerified) {
    return master.initialVerified;
  }
  return false;
});

const route = useRoute();
const currentComponent = shallowRef(null);
const currentComponentKey = shallowRef(route.path);

const setCurrentComponent = () => {
  if (route.path === '/auth/login') {
    currentComponent.value = Login;
  } else if (route.path === '/auth/invite') {
    currentComponent.value = Invite;
  } else if (route.path === '/auth/reset') {
    currentComponent.value = Reset;
  } else if (route.path === '/auth/telegram') {
    currentComponent.value = TelegramLogin;
  }
  currentComponentKey.value = route.path;
};

// Функция для обработки изменения видимости страницы
const handleVisibilityChange = () => {
  if (soundRain) {
    if (document.hidden) {
      // Останавливаем звук, если вкладка не активна
      soundRain.pause();
    } else {
      // Включаем звук, если вкладка снова активна
      soundRain.play();
    }
  }
};

function setViewportHeight() {
  // Рассчитываем 1vh как 1% от высоты видимой области
  let vh = window.innerHeight * 0.01;
  // Устанавливаем его в качестве CSS-переменной
  document.documentElement.style.setProperty('--vh', `${vh}px`);

}


watchEffect(() => {
  setCurrentComponent();
});

const version = __APP_VERSION__;

import * as THREE from 'three'
import * as kokomi from 'kokomi.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {BloomEffect, EffectComposer, EffectPass, RenderPass, FXAAEffect} from 'postprocessing'
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js'
//import {Howl} from 'howler'
import gsap from 'gsap'
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  watchEffect
} from "vue";

import brickNormal from '@/assets/textures/brick-normal2.jpg';
import floorNormal from '@/assets/textures/asphalt-pbr01/normal.webp';
import floorOpacity from '@/assets/textures/asphalt-pbr01/opacity.webp';
import floorRoughness from '@/assets/textures/asphalt-pbr01/roughness.webp';
import rainNormal from '@/assets/textures/rain-normal.png';
import shutterDiffuse from '@/assets/textures/door/shutter-Diffuse.webp';
import shutterGlossiness from '@/assets/textures/door/shutter-Glossiness.webp';
import shutterNormal from '@/assets/textures/door/shutter-Normal.webp';
import topCoverDiffuse from '@/assets/textures/door/top-cover-Diffuse.webp';
import sideCoverDiffuse from '@/assets/textures/door/side-cover-Diffuse.webp';
//import rainSound from '@/assets/sound/rain.mp3';
import sceneModel from '@/assets/models/scene.glb';
import store from "@/core/state/store.js";
import {LISTING} from "@/core/constants.js";
import Getstarted from "@/components/fragments/auth/Getstarted.vue";
import router from "@/router/index.js";
import * as masterService from "@/core/services/masterService.js";
import {useI18n} from "vue-i18n";

const vertexShader = `
uniform mat4 textureMatrix;

varying vec2 vUv;
varying vec4 vMirrorCoord;
varying vec3 vWorldPosition;

// https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/
vec4 getWorldPosition(mat4 modelMat,vec3 pos){
    vec4 worldPosition=modelMat*vec4(pos,1.);
    return worldPosition;
}

void main(){
    vec3 p=position;

    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);

    vUv=uv;
    vMirrorCoord=textureMatrix*vec4(p,1.);
    vWorldPosition=getWorldPosition(modelMatrix,p).xyz;
}
`;

const fragmentShader = `
// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
vec4 sampleBicubic(float v){
    vec4 n=vec4(1.,2.,3.,4.)-v;
    vec4 s=n*n*n;
    vec4 o;
    o.x=s.x;
    o.y=s.y-4.*s.x;
    o.z=s.z-4.*s.y+6.*s.x;
    o.w=6.-o.x-o.y-o.z;
    return o;
}

vec4 sampleBicubic(sampler2D tex,vec2 st,vec2 texResolution){
    vec2 pixel=1./texResolution;
    st=st*texResolution-.5;

    vec2 fxy=fract(st);
    st-=fxy;

    vec4 xcubic=sampleBicubic(fxy.x);
    vec4 ycubic=sampleBicubic(fxy.y);

    vec4 c=st.xxyy+vec2(-.5,1.5).xyxy;

    vec4 s=vec4(xcubic.xz+xcubic.yw,ycubic.xz+ycubic.yw);
    vec4 offset=c+vec4(xcubic.yw,ycubic.yw)/s;

    offset*=pixel.xxyy;

    vec4 sample0=texture(tex,offset.xz);
    vec4 sample1=texture(tex,offset.yz);
    vec4 sample2=texture(tex,offset.xw);
    vec4 sample3=texture(tex,offset.yw);

    float sx=s.x/(s.x+s.y);
    float sy=s.z/(s.z+s.w);

    return mix(mix(sample3,sample2,sx),mix(sample1,sample0,sx),sy);
}

// With original size argument
vec4 packedTexture2DLOD(sampler2D tex,vec2 uv,int level,vec2 originalPixelSize){
    float floatLevel=float(level);
    vec2 atlasSize;
    atlasSize.x=floor(originalPixelSize.x*1.5);
    atlasSize.y=originalPixelSize.y;
    // we stop making mip maps when one dimension == 1
    float maxLevel=min(floor(log2(originalPixelSize.x)),floor(log2(originalPixelSize.y)));
    floatLevel=min(floatLevel,maxLevel);
    // use inverse pow of 2 to simulate right bit shift operator
    vec2 currentPixelDimensions=floor(originalPixelSize/pow(2.,floatLevel));
    vec2 pixelOffset=vec2(
        floatLevel>0.?originalPixelSize.x:0.,
        floatLevel>0.?currentPixelDimensions.y:0.
    );
    // "minPixel / atlasSize" samples the top left piece of the first pixel
    // "maxPixel / atlasSize" samples the bottom right piece of the last pixel
    vec2 minPixel=pixelOffset;
    vec2 maxPixel=pixelOffset+currentPixelDimensions;
    vec2 samplePoint=mix(minPixel,maxPixel,uv);
    samplePoint/=atlasSize;
    vec2 halfPixelSize=1./(2.*atlasSize);
    samplePoint=min(samplePoint,maxPixel/atlasSize-halfPixelSize);
    samplePoint=max(samplePoint,minPixel/atlasSize+halfPixelSize);
    return sampleBicubic(tex,samplePoint,originalPixelSize);
}

vec4 packedTexture2DLOD(sampler2D tex,vec2 uv,float level,vec2 originalPixelSize){
    float ratio=mod(level,1.);
    int minLevel=int(floor(level));
    int maxLevel=int(ceil(level));
    vec4 minValue=packedTexture2DLOD(tex,uv,minLevel,originalPixelSize);
    vec4 maxValue=packedTexture2DLOD(tex,uv,maxLevel,originalPixelSize);
    return mix(minValue,maxValue,ratio);
}

// https://www.shadertoy.com/view/4djSRW
float hash12(vec2 p){
    vec3 p3=fract(vec3(p.xyx)*.1031);
    p3+=dot(p3,p3.yzx+19.19);
    return fract((p3.x+p3.y)*p3.z);
}

vec2 hash22(vec2 p){
    vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
    p3+=dot(p3,p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value,float min1,float max1,float min2,float max2){
    return min2+(value-min1)*(max2-min2)/(max1-min1);
}

uniform vec3 color;
uniform sampler2D tDiffuse;
varying vec2 vUv;
varying vec4 vMirrorCoord;
varying vec3 vWorldPosition;

uniform sampler2D uRoughnessTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uOpacityTexture;
uniform vec2 uTexScale;
uniform vec2 uTexOffset;
uniform float uDistortionAmount;
uniform float uBlurStrength;
uniform float iTime;
uniform float uRainCount;
uniform vec2 uMipmapTextureSize;

#define MAX_RADIUS 1
#define DOUBLE_HASH 0

void main(){
    vec2 p=vUv;
    vec2 texUv=p*uTexScale;
    texUv+=uTexOffset;
    float floorOpacity=texture(uOpacityTexture,texUv).r;
    vec3 floorNormal=texture(uNormalTexture,texUv).rgb*2.-1.;
    floorNormal=normalize(floorNormal);
    float roughness=texture(uRoughnessTexture,texUv).r;

    vec2 reflectionUv=vMirrorCoord.xy/vMirrorCoord.w;

    // https://www.shadertoy.com/view/ldfyzl
    vec2 rippleUv=75.*p*uTexScale;

    vec2 p0=floor(rippleUv);

    float rainStrength=map(uRainCount,0.,10000.,3.,.5);
    if(rainStrength==3.){
        rainStrength=50.;
    }

    vec2 circles=vec2(0.);
    for(int j=-MAX_RADIUS;j<=MAX_RADIUS;++j)
    {
        for(int i=-MAX_RADIUS;i<=MAX_RADIUS;++i)
        {
            vec2 pi=p0+vec2(i,j);
            #if DOUBLE_HASH
            vec2 hsh=hash22(pi);
            #else
            vec2 hsh=pi;
            #endif
            vec2 p=pi+hash22(hsh);

            float t=fract(.8*iTime+hash12(hsh));
            vec2 v=p-rippleUv;
            float d=length(v)-(float(MAX_RADIUS)+1.)*t+(rainStrength*.1*t);

            float h=1e-3;
            float d1=d-h;
            float d2=d+h;
            float p1=sin(31.*d1)*smoothstep(-.6,-.3,d1)*smoothstep(0.,-.3,d1);
            float p2=sin(31.*d2)*smoothstep(-.6,-.3,d2)*smoothstep(0.,-.3,d2);
            circles+=.5*normalize(v)*((p2-p1)/(2.*h)*(1.-t)*(1.-t));
        }
    }
    circles/=float((MAX_RADIUS*2+1)*(MAX_RADIUS*2+1));

    float intensity=.05*floorOpacity;
    vec3 n=vec3(circles,sqrt(1.-dot(circles,circles)));

    vec2 rainUv=intensity*n.xy;

    vec2 finalUv=reflectionUv+floorNormal.xy*uDistortionAmount-rainUv;

    float level=roughness*uBlurStrength;

    vec3 col=packedTexture2DLOD(tDiffuse,finalUv,level,uMipmapTextureSize).rgb;

    gl_FragColor=vec4(col,1.);

    // vec4 base=texture2DProj(tDiffuse,vec4(finalUv,1.,1.));
    // gl_FragColor=vec4(base.rgb,1.);
}
`;

const vertexShader2 = `
#define GLSLIFY 1
attribute float aProgress;
attribute float aSpeed;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec2 vScreenSpace;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uSpeed;
uniform float uHeightRange;

void main()	{
    vUv = uv;

    vec3 transformed = vec3( position );

    vec3 up = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
    vec3 right = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
    vec3 billboardPos = right * position.x + up * position.y;

    vec4 mvPosition = vec4( billboardPos, 1.0 );

    float yPos = mod(aProgress - uTime * aSpeed * 0.25, 1.) * uHeightRange - (uHeightRange * 0.5);
    // float yPos = mod(aProgress, 1.) * 20. - 10.;

    vec4 worldPosition = vec4( transformed, 1.0 );
    #ifdef USE_INSTANCING
        worldPosition = instanceMatrix * worldPosition;
    #endif
    worldPosition.y += yPos;
    worldPosition = modelMatrix * worldPosition;
    vWorldPosition = worldPosition.xyz;

    vPosition = transformed;

    #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
    #endif

    mvPosition.y += yPos;

    vec4 earlyProjection = projectionMatrix * modelViewMatrix * mvPosition;
    vScreenSpace = earlyProjection.xy / earlyProjection.w * 0.5 + vec2(0.5);

    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

    vViewPosition = -mvPosition.xyz;
}
`;

const fragmentShader2 = `
#define GLSLIFY 1
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vScreenSpace;
varying vec3 vViewPosition;

uniform sampler2D uBgTexture;
uniform sampler2D uNormalTexture;
uniform float uBaseBrightness;
uniform float uRefraction;

void main() {
    vec4 normalColor = texture2D(uNormalTexture, vUv);

    if (normalColor.a < 0.5) discard;

    vec3 normal = normalize(normalColor.rgb * 2. - 1.);

    vec2 uv = vUv;
    uv = normal.xy;
    uv = vec2(vScreenSpace.x, vScreenSpace.y) + uv * uRefraction;

    vec4 bgColor = texture2D(uBgTexture, uv);

    // vec3 rainColor = vec3(0.89, 0.92, 1.);
    // gl_FragColor = vec4(rainColor, 1.);
    gl_FragColor = vec4(bgColor.rgb + uBaseBrightness * pow(normal.b, 10.), 1.);
    // gl_FragColor = vec4(normal.rgb, 1.);
}
`;

let mouseX = 0,
    mouseY = 0,
    isSlowMo = false,
    flag = false

function mouseMoveHandler(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function mouseDownHandler() {
  isSlowMo = true;
  flag = true;
}

function mouseUpHandler() {
  isSlowMo = false;
  flag = true;
}

function touchStartHandler(event) {
  isSlowMo = true;
  flag = true;
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}

function touchEndHandler(event) {
  isSlowMo = false;
  flag = true;
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}

window.addEventListener("mousemove", mouseMoveHandler);
window.addEventListener("mousedown", mouseDownHandler);
window.addEventListener("mouseup", mouseUpHandler);
window.addEventListener("touchstart", touchStartHandler);
window.addEventListener("touchend", touchEndHandler);
window.addEventListener('resize', setViewportHeight);
document.addEventListener('visibilitychange', handleVisibilityChange);


class RainFloor extends kokomi.Component {
  constructor(base, config = {}) {
    super(base)
    const {count = 1000} = config;

    const am = this.base.am;

    // floor
    const fNormalTex = am.items["floor-normal"];
    const fOpacityTex = am.items["floor-opacity"];
    const fRoughnessTex = am.items["floor-roughness"];
    fNormalTex.wrapS = fNormalTex.wrapT = THREE.MirroredRepeatWrapping;
    fOpacityTex.wrapS = fOpacityTex.wrapT = THREE.MirroredRepeatWrapping;
    fRoughnessTex.wrapS = fRoughnessTex.wrapT = THREE.MirroredRepeatWrapping;

    // custom reflector
    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
    const mirror = new kokomi.Reflector(new THREE.PlaneGeometry(25, 100));
    this.mirror = mirror;
    mirror.position.z = -25;
    mirror.rotation.x = -Math.PI / 2;

    mirror.material.uniforms = {
      ...mirror.material.uniforms,
      ...uj.shadertoyUniforms,
      ...{
        uNormalTexture: {
          value: fNormalTex,
        },
        uOpacityTexture: {
          value: fOpacityTex,
        },
        uRoughnessTexture: {
          value: fRoughnessTex,
        },
        uRainCount: {
          value: count,
        },
        uTexScale: {
          value: new THREE.Vector2(1, 4),
        },
        uTexOffset: {
          value: new THREE.Vector2(1, -0.5),
        },
        uDistortionAmount: {
          value: 0.25,
        },
        uBlurStrength: {
          value: 8,
        },
        uMipmapTextureSize: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
    };
    mirror.material.vertexShader = vertexShader;
    mirror.material.fragmentShader = fragmentShader;

    const mipmapper = new kokomi.PackedMipMapGenerator();
    this.mipmapper = mipmapper;
    const mirrorFBO = mirror.getRenderTarget();
    this.mirrorFBO = mirrorFBO;
    const mipmapFBO = new kokomi.FBO(this.base);
    this.mipmapFBO = mipmapFBO;

    mirror.material.uniforms.tDiffuse.value = mipmapFBO.rt.texture;
  }

  addExisting() {
    this.base.scene.add(this.mirror);
  }

  update() {
    this.uj.injectShadertoyUniforms(this.mirror.material.uniforms);

    this.mipmapper.update(
        this.mirrorFBO.texture,
        this.mipmapFBO.rt,
        this.base.renderer
    );
  }
}

class Rain extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const {count = 800, speed = 1.5, debug = false} = config;

    const am = this.base.am;

    // rain
    const rNormalTex = am.items["rain-normal"];
    rNormalTex.flipY = false;

    const uj = new kokomi.UniformInjector(this.base);

    this.uj = uj;
    const rainMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      uniforms: {
        ...uj.shadertoyUniforms,
        ...{
          uHeightRange: {
            value: 20,
          },
          uNormalTexture: {
            value: rNormalTex,
          },
          uBgTexture: {
            value: null,
          },
          uBgRt: {
            value: null,
          },
          uRefraction: {
            value: 0.05,
          },
          uBaseBrightness: {
            value: 0.07,
          },
          uTime: {
            value: 0,
          },
        },
      },
    })
    this.rainMat = rainMat

    const rain = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(),
        rainMat,
        count
    )
    this.rain = rain
    rain.instanceMatrix.needsUpdate = true

    const dummy = new THREE.Object3D()

    const progressArr = []
    const speedArr = []

    for (let i = 0; i < rain.count; i++) {
      dummy.position.set(
          THREE.MathUtils.randFloat(-10, 10),
          0,
          THREE.MathUtils.randFloat(-20, 10)
      );
      dummy.scale.set(0.03, THREE.MathUtils.randFloat(0.3, 0.5), 0.03);
      if (debug) {
        dummy.scale.setScalar(1);
        rainMat.uniforms.uSpeed.value = 0;
      }
      dummy.updateMatrix();
      rain.setMatrixAt(i, dummy.matrix);

      progressArr.push(Math.random());
      speedArr.push(dummy.scale.y * 10);
    }

    rain.rotation.set(-0.1, 0, 0.1);
    rain.position.set(0, 9, 9);

    rain.geometry.setAttribute(
        "aProgress",
        new THREE.InstancedBufferAttribute(new Float32Array(progressArr), 1)
    );
    rain.geometry.setAttribute(
        "aSpeed",
        new THREE.InstancedBufferAttribute(new Float32Array(speedArr), 1)
    );

    const bgFBO = new kokomi.FBO(this.base, {
      width: window.innerWidth * 0.1,
      height: window.innerHeight * 0.1,
    })

    this.bgFBO = bgFBO
    rainMat.uniforms.uBgTexture.value = bgFBO.rt.texture

    const fboCamera = this.base.camera.clone()
    this.fboCamera = fboCamera
  }

  addExisting() {
    this.base.scene.add(this.rain)
  }

  update() {
    this.uj.injectShadertoyUniforms(this.rainMat.uniforms)

    this.rain.visible = false
    this.base.renderer.setRenderTarget(this.bgFBO.rt)
    this.base.renderer.render(this.base.scene, this.fboCamera)
    this.base.renderer.setRenderTarget(null)
    this.rain.visible = true
  }
}

let soundRain;

class Sketch extends kokomi.Base {

  create() {

    this.camera.position.set(0, 2, 9);

    const lookAt = new THREE.Vector3(0, 2, 0);
    this.camera.lookAt(lookAt);

    const controls = new kokomi.OrbitControls(this);
    controls.controls.target = lookAt;
    controls.controls.enabled = false;

    // config
    const config = {
      rainCount: 600,
      slowMoFactor: 1,
      rainSpeed: 1.5,
      debug: false,
      soundRate: 1,
      cameraZOffset: 10,
    };

    let am = new kokomi.AssetManager(this, [
      {
        name: "brick-normal",
        type: "texture",
        path: brickNormal,
      },
      {
        name: "floor-normal",
        type: "texture",
        path: floorNormal,
      },
      {
        name: "floor-opacity",
        type: "texture",
        path: floorOpacity,
      },
      {
        name: "floor-roughness",
        type: "texture",
        path: floorRoughness,
      },
      {
        name: "rain-normal",
        type: "texture",
        path: rainNormal,
      },
      {
        name: "shutter-diffuse",
        type: "texture",
        path: shutterDiffuse,
      },
      {
        name: "shutter-glossiness",
        type: "texture",
        path: shutterGlossiness,
      },
      {
        name: "shutter-normal",
        type: "texture",
        path: shutterNormal,
      },
      {
        name: "top-cover-diffuse",
        type: "texture",
        path: topCoverDiffuse,
      },
      {
        name: "side-cover-diffuse",
        type: "texture",
        path: sideCoverDiffuse,
      },
    ]);

    this.am = am

    am.on("ready", async () => {

      if (isDestroyed) {
        console.log("Component was destroyed before scene was ready");
        return; // Отменяем инициализацию, если компонент был уничтожен
      }

      console.log("ready scene");

      // soundRain = new Howl({
      //   src: [rainSound],
      //   loop: true,
      //   autoplay: true,
      //   rate: config.soundRate
      // })

      // lights
      const pointLight1 = new THREE.PointLight("#81C8F2", 0.5, 17, 0.8)
      pointLight1.position.set(0, 2.3, 0)
      this.scene.add(pointLight1)

      const pointLight2 = new THREE.PointLight("#81C8F2", 2, 30)
      pointLight2.position.set(0, 30, 0)
      this.scene.add(pointLight2)

      const rectLight1 = new THREE.RectAreaLight("#81C8F2", 20, 19.1, 0.2)
      rectLight1.position.set(0, 8.066, -9.8)
      rectLight1.rotation.set(
          THREE.MathUtils.degToRad(90),
          THREE.MathUtils.degToRad(180),
          0
      )
      this.scene.add(rectLight1)

      RectAreaLightUniformsLib.init()

      const rectLight1Helper = new kokomi.RectAreaLightHelper(rectLight1)

      this.scene.add(rectLight1Helper)


      // brick
      const brickTex = am.items["brick-normal"]
      brickTex.rotation = THREE.MathUtils.degToRad(90)
      brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping
      brickTex.repeat.set(5, 8)

      // shutter
      const shutterDiffuseTex = am.items["shutter-diffuse"]
      shutterDiffuseTex.flipY = !1

      const shutterGlossinessTex = am.items["shutter-glossiness"]
      shutterGlossinessTex.flipY = !1

      const shutterNormalTex = am.items["shutter-normal"]
      shutterNormalTex.flipY = !1

      // top-cover
      const topCoverTex = am.items["top-cover-diffuse"]
      topCoverTex.flipY = !1

      // side-cover
      const sideCoverTex = am.items["side-cover-diffuse"]
      sideCoverTex.flipY = !1

      // model
      const gltfLoader = new GLTFLoader();
      const url = sceneModel;
      gltfLoader.load(url, (gltf) => {
        const root = gltf.scene

        //   root.position.x -= 2;

        const walls = root.getObjectByName("walls");
        walls.material = new THREE.MeshPhongMaterial({
          color: new THREE.Color("#111111"),
          normalMap: brickTex,
          normalScale: new THREE.Vector2(0.5, 0.5),
          shininess: 50,
        })

        const shutter = root.getObjectByName("shutter");
        shutter.material = new THREE.MeshPhysicalMaterial({
          map: shutterDiffuseTex,
          roughnessMap: shutterGlossinessTex,
          normalMap: shutterNormalTex,
          reflectivity: 0.8,
          roughness: 0.5,
          metalness: 0.3,
          specularIntensity: 0.5,
        })

        const topCover = root.getObjectByName("top-cover");
        topCover.material = new THREE.MeshPhysicalMaterial({
          map: topCoverTex,
          reflectivity: 0.7,
          metalness: 0.2,
          specularIntensity: 0.5,
        })

        const sideCover = root.getObjectByName("side-cover");
        sideCover.material = new THREE.MeshPhysicalMaterial({
          map: sideCoverTex,
          reflectivity: 0.7,
          metalness: 0.2,
          specularIntensity: 0.5,
        });

        const floor = root.getObjectByName("floor");
        root.remove(floor);

        this.scene.add(root);
      })

      // rain floor
      const rainFloor = new RainFloor(this, {
        count: config.rainCount,
      })
      rainFloor.addExisting()

      // rain
      const rain = new Rain(this, {
        speed: config.rainSpeed,
        count: config.rainCount,
        debug: false,
      })
      rain.addExisting()

      rainFloor.mirror.ignoreObjects.push(rain.rain)

      // flicker
      const turnOffLight = () => {
        rectLight1.color.copy(new THREE.Color("#000"))
        //  rectLight2.color.copy(new THREE.Color("#000"))
      }

      const turnOnLight = () => {
        rectLight1.color.copy(new THREE.Color("#81C8F2"))
        //   rectLight2.color.copy(new THREE.Color("#81C8F2"))
      }

      let flickerTimer = null;

      const flicker = () => {
        flickerTimer = setInterval(async () => {
          const rate = Math.random()
          if (rate < 0.5) {
            turnOffLight()
            await kokomi.sleep(200 * Math.random())
            turnOnLight()
            await kokomi.sleep(200 * Math.random())
            turnOffLight()
            await kokomi.sleep(200 * Math.random())
            turnOnLight()
          }
        }, 3000)
      }

      flicker()

      // postprocessing
      const composer = new EffectComposer(this.renderer)
      this.composer = composer

      composer.addPass(new RenderPass(this.scene, this.camera))

      // bloom
      const bloom = new BloomEffect({
        luminanceThreshold: 0.4,
        luminanceSmoothing: 0,
        mipmapBlur: true,
        intensity: 2,
        radius: 0.4,
      })
      composer.addPass(new EffectPass(this.camera, bloom))

      // antialiasing
      const fxaa = new FXAAEffect()
      composer.addPass(new EffectPass(this.camera, fxaa))

      // camera rotate
      const smoothMouse = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)]
      const mouseMoveAngle = new THREE.Vector2(0.5, 0.08)

      const euler = new THREE.Euler(0, 0, 0, "XYZ")
      const quaternion = new THREE.Quaternion()

      const clock = new THREE.Clock()


      this.update(() => {
        rain.rain.material.uniforms.uTime.value += clock.getDelta() * config.rainSpeed
        rainFloor.mirror.material.uniforms.iTime.value = rainFloor.mirror.material.uniforms.iTime.value / config.slowMoFactor

        smoothMouse[0].lerp({x: mouseX, y: mouseY}, 0.03);
        smoothMouse[1].lerp({x: mouseX, y: mouseY}, 0.07);
        this.camera.position.copy(new THREE.Vector3(0, 2, 0));
        this.camera.lookAt(lookAt);

        if (!controls.controls.enabled) {
          this.camera.translateZ(-2);
          euler.set(smoothMouse[0].y * mouseMoveAngle.y, -smoothMouse[0].x * mouseMoveAngle.x, 0);
          quaternion.setFromEuler(euler);

          this.camera.quaternion.multiply(quaternion);
          euler.set(0, 0, (smoothMouse[0].x - smoothMouse[1].x) * -0.1);
          quaternion.setFromEuler(euler);

          this.camera.quaternion.multiply(quaternion);
          this.camera.translateZ(config.cameraZOffset);
          this.camera.updateMatrixWorld();
        }

        if (isSlowMo && flag) {
          gsap.timeline({
            defaults: {
              duration: 2,
              ease: 'power2.out',
              overwrite: true
            }
          }).to(config, {
            slowMoFactor: 10,
            rainSpeed: 0.02,
            cameraZOffset: 5,
            soundRate: 0.1,
            onUpdate: () => {
              if (soundRain) {
                soundRain.rate(config.soundRate);
              }
            }
          })

          flag = false
        } else if (flag) {
          gsap.timeline({
            defaults: {
              duration: 1,
              ease: 'power2.inOut',
              overwrite: true
            }
          }).to(config, {
            slowMoFactor: 1,
            rainSpeed: 1.5,
            cameraZOffset: 10,
            soundRate: 1,
            onUpdate: () => {
              if (soundRain) {
                soundRain.rate(config.soundRate)
              }
            }
          })

          flag = false
        }
      })
    })

  }

  disposeResources() {
    Object.values(this.am.items).forEach(item => {
      if (item.dispose) {
        item.dispose();
      }
    });

  }

  destroy() {
    if (soundRain) {
      soundRain.stop();
      soundRain.unload();
      soundRain = null;
    }

    this.disposeResources();

    // Удаление всех объектов из сцены
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      if (object.texture) object.texture.dispose();
    }

    // Удаление WebGL-контекста
    this.renderer.dispose();

    // Удаление всех слушателей событий
    window.removeEventListener("mousemove", mouseMoveHandler);
    window.removeEventListener("mousedown", mouseDownHandler);
    window.removeEventListener("mouseup", mouseUpHandler);
    window.removeEventListener("touchstart", touchStartHandler);
    window.removeEventListener("touchend", touchEndHandler);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('resize', setViewportHeight);

  }

}

setViewportHeight();

const intervalId = ref(null);  // Для сохранения идентификатора интервала
const countdownText = ref('');

// Функция запуска обратного отсчета
const startCountdownListing = () => {
  intervalId.value = setInterval(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = LISTING - currentTime;

    if (remainingTime <= 0) {
      stopCountdownListing();
      countdownText.value = ''; // Время прошло
    } else {
      // Рассчитываем оставшееся время
      const months = Math.floor(remainingTime / (30 * 24 * 3600));
      const days = Math.floor((remainingTime % (30 * 24 * 3600)) / (24 * 3600));
      const hours = Math.floor((remainingTime % (24 * 3600)) / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = remainingTime % 60;

      // Формируем текст обратного отсчета
      let countdown = '';
      if (months > 0) countdown += `${months}M `;
      if (days > 0 || months > 0) countdown += `${days}d `;
      countdown += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      countdownText.value = countdown.trim(); // Обновляем текст обратного отсчета
    }
  }, 1000);
};


const stopCountdownListing = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
}

let sketch;

const goTo = (page) => {
  router.push(page)
};


let isDestroyed = false;

onMounted(() => {
  isDestroyed = false;

  sketch = new Sketch();
  sketch.create();
});

onBeforeUnmount(() => {
  isDestroyed = true;
  if (sketch) {
    sketch.destroy();
    sketch = null;
  }
});


watch(isAuthenticated, (newValue) => {
  if (newValue) {
    startCountdownListing();
    masterService.isShowPrivacyInfo(t('info.showPrivacyInfo'));
    store.dispatch('master/initGetStarted');
  }
}, {immediate: true});


</script>

<style>

#sketch {
  width: 100vw;
  height: calc(var(--vh, 1vh) * 100);
  background: black;
  overflow: hidden;
}

.foreground {
  position: absolute; /* Абсолютное позиционирование для покрытия всей области контейнера */
  top: 0;
  left: 0;
  width: 100vw;
  height: calc(var(--vh, 1vh) * 100);
}

.explode-enter-active, .explode-leave-active {
  transition: transform 0.1s, opacity 0.3s; /* Уменьшено время перехода */
}

.explode-enter-from {
  opacity: 0;
  transform: scale(0);
}

.explode-leave-to {
  opacity: 0;
  transform: scale(1.5) rotate(720deg);
}

.beta-text {
  position: absolute;
  bottom: 1vh;
  left: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.timer-listing-container {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.timer-overlay {
  font-family: AnonymousBalance, sans-serif;
  color: white;
  text-align: center;
  font-size: 4rem;
  padding: 10px;
  border-radius: 10px;
  display: flex;
}

.text-pages-link {
  /* position: absolute;
   top: 10%;
   left: 50%;
   transform: translateX(-50%);*/
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-grow: 1;
}

.btn-text-page {
  text-decoration: none;
  margin: 10px 10px;
  font-family: 'Anonymous', sans-serif;
  color: white;
  font-size: 2em;
  /*  background: rgba(51, 51, 51, 0.8);*/
  background: var(--black-opacity-80);
  padding: 10px 20px;
  text-align: center;
  width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--gray1);
  border-radius: 4px;
  cursor: pointer;
}
</style>
