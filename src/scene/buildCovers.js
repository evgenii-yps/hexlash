// buildCovers.js — УКРЫТИЯ ОТКРЫТОГО ПОЛЯ, объёмная часть. Низкие толстые блоки
// на плите.
//
// ВИД. Матовые, огранённые, из той же семьи, что плита и боец: материал берётся
// из одного места (MATERIALS), а не набирается числами заново — именно общий
// материал и делает пол, тело и блок «из одного цеха». Свечения нет, розового
// нет: розовое в игре принадлежит действию, а укрытие — часть мира.
//
// Тон взят чуть светлее плиты (MATERIALS.pedestal — тот же, которым сделаны
// постаменты зала). Ровно из плиточного тона блоки на ней не читались бы вовсе:
// они СТОЯТ на полу, и глаз должен видеть край.
//
// ⚠️ ВСЕ БЛОКИ — ОДНА ГЕОМЕТРИЯ И ОДИН ВЫЗОВ ОТРИСОВКИ. Их сорок; сорок
//    отдельных мешей — это сорок вызовов на каждый кадр ради предметов, которые
//    никогда не двигаются. Геометрии сливаются в один буфер при сборке.
//
// ЧИСЕЛ ЗДЕСЬ НЕТ. Размеры и расстановка приходят раскладкой
// (data/openFieldCovers.js), а она считает их из блока чисел режима.
//
// Экспортирует: buildCovers.

import * as THREE from 'three';
import { MATERIALS } from '@/data/sceneTokens.js';

/**
 * @param {object[]} covers раскладка (buildCoverLayout)
 * @param {number} topY высота верха плиты — блоки стоят НА ней, а не в ней
 * @returns {{ group: THREE.Group, dispose: () => void }}
 */
export function buildCovers(covers, topY) {
  const group = new THREE.Group();
  if (!covers.length) return { group, dispose: () => {} };

  // Слепок: единичный куб, повёрнутый и растянутый под каждый блок, всё в один
  // буфер. Позиции складываем сразу в мировых координатах поля.
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const upos = unit.attributes.position;
  const unor = unit.attributes.normal;
  const uidx = unit.index;
  const vCount = upos.count;
  const iCount = uidx.count;

  const pos = new Float32Array(vCount * covers.length * 3);
  const nor = new Float32Array(vCount * covers.length * 3);
  const idx = new Uint32Array(iCount * covers.length);

  const m = new THREE.Matrix4();
  const nm = new THREE.Matrix3();
  const v = new THREE.Vector3();

  covers.forEach((c, k) => {
    // Блок стоит НА плите: его низ на уровне верха плиты, значит середина — на
    // половину высоты выше.
    m.makeRotationY(c.a);
    m.scale(new THREE.Vector3(c.hl * 2, c.h, c.ht * 2));
    m.setPosition(c.x, topY + c.h / 2, c.z);
    nm.getNormalMatrix(m);
    const vo = k * vCount;
    for (let i = 0; i < vCount; i += 1) {
      v.fromBufferAttribute(upos, i).applyMatrix4(m);
      pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      v.fromBufferAttribute(unor, i).applyMatrix3(nm).normalize();
      nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
    }
    const io = k * iCount;
    for (let i = 0; i < iCount; i += 1) idx[io + i] = uidx.getX(i) + vo;
  });
  unit.dispose();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();

  // Материал — из одного места, не числами. `flatShading` уже сидит в токене:
  // огранка и есть визуальный закон этого мира.
  const mat = new THREE.MeshStandardMaterial({ ...MATERIALS.pedestal });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const dispose = () => { geo.dispose(); mat.dispose(); };
  return { group, dispose };
}
