import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const BUTTERFLY_GLB = "/manus-storage/butterfly-cc0-animated_0dc0a5a0.glb";
const GOLD_DUST_STAR = "/manus-storage/gold-dust-star-cc0_bbd3bebd.png";
const CYCLE_SECONDS = 7.166;
const FLIGHT_START = 0.256;
const FLIGHT_END = 0.668;
const MODEL_BASE_Y = Math.PI / 2 - 0.52;

type ButterflyProps = {
  className: string;
  motionSourceRef: RefObject<HTMLSpanElement | null>;
  tailAnchorRef: RefObject<HTMLSpanElement | null>;
  bodyGlowStyle?: CSSProperties;
};

type GoldDustProps = {
  motionSourceRef: RefObject<HTMLSpanElement | null>;
  tailAnchorRef: RefObject<HTMLSpanElement | null>;
};

function getCycleProgress(element: HTMLSpanElement | null) {
  const animation = element
    ?.getAnimations()
    .find(
      item =>
        (item as CSSAnimation).animationName ===
        "store-select-flame-butterfly-side-profile-cycle"
    );
  const progress = animation?.effect?.getComputedTiming().progress;
  return progress === null || progress === undefined ? null : progress;
}

function makeCanvasRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  return renderer;
}

function installLegAndUnderbodyMask(
  material: THREE.MeshStandardMaterial | THREE.MeshPhongMaterial,
  legBoneIndices: number[]
) {
  if (legBoneIndices.length === 0) return;
  const legMaskStatements = ["x", "y", "z", "w"]
    .map(
      component =>
        `if (${legBoneIndices
          .map(
            index => `abs(skinIndex.${component} - ${index.toFixed(1)}) < 0.1`
          )
          .join(" || ")}) vLegMask += skinWeight.${component};`
    )
    .join("\n");
  material.onBeforeCompile = shader => {
    shader.vertexShader =
      `varying float vLegMask;\nvarying float vUnderbodyMask;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
       vLegMask = 0.0;
       vUnderbodyMask = position.y < 0.72 && abs(position.x) < 0.85 && position.z > 0.0 ? 1.0 : 0.0;
       ${legMaskStatements}`
      );
    shader.fragmentShader =
      `varying float vLegMask;\nvarying float vUnderbodyMask;\n${shader.fragmentShader}`.replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
       if (vLegMask > 0.015 || vUnderbodyMask > 0.5) discard;`
      );
  };
  material.customProgramCacheKey = () =>
    `cc0-butterfly-leg-and-underbody-mask-${legBoneIndices.join("-")}`;
  material.needsUpdate = true;
}

function stripLegTriangles(mesh: THREE.SkinnedMesh, legBoneIndices: number[]) {
  if (legBoneIndices.length === 0) return;
  const source = mesh.geometry;
  const skinIndex = source.getAttribute("skinIndex");
  const skinWeight = source.getAttribute("skinWeight");
  const position = source.getAttribute("position");
  if (!skinIndex || !skinWeight || !position) return;

  const legIndexSet = new Set(legBoneIndices);
  const hasLegInfluence = (vertex: number) =>
    [0, 1, 2, 3].some(
      component =>
        legIndexSet.has(skinIndex.getComponent(vertex, component)) &&
        skinWeight.getComponent(vertex, component) > 0.001
    );
  const sourceIndex = source.getIndex();
  const keptIndices: number[] = [];
  const triangleCount = sourceIndex
    ? Math.floor(sourceIndex.count / 3)
    : Math.floor(position.count / 3);

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3;
    const vertices = sourceIndex
      ? [
          sourceIndex.getX(offset),
          sourceIndex.getX(offset + 1),
          sourceIndex.getX(offset + 2),
        ]
      : [offset, offset + 1, offset + 2];
    if (!vertices.some(hasLegInfluence)) keptIndices.push(...vertices);
  }

  const strippedGeometry = source.clone();
  strippedGeometry.setIndex(keptIndices);
  strippedGeometry.computeBoundingSphere();
  mesh.geometry = strippedGeometry;
  source.dispose();
}

function makeGoldenWingGlowGroup() {
  const group = new THREE.Group();
  const addGlowMaterial = <T extends THREE.Material>(
    material: T,
    base: number
  ) => {
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = false;
    material.blending = THREE.AdditiveBlending;
    material.opacity = 0;
    material.userData.glowBase = base;
    return material;
  };
  const addWing = (direction: 1 | -1, lift: number, scale: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(
      direction * 0.62 * scale,
      lift * 1.45 * scale,
      direction * 1.72 * scale,
      lift * 0.78 * scale
    );
    shape.quadraticCurveTo(direction * 1.43 * scale, lift * 0.02 * scale, 0, 0);
    const membrane = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      addGlowMaterial(
        new THREE.MeshBasicMaterial({
          color: 0xff9f2e,
          side: THREE.DoubleSide,
        }),
        lift > 0 ? 0.16 : 0.1
      )
    );
    membrane.position.z = 0.12;
    group.add(membrane);

    const outlinePoints = [
      new THREE.Vector3(0, 0, 0.15),
      new THREE.Vector3(direction * 0.62 * scale, lift * 1.45 * scale, 0.15),
      new THREE.Vector3(direction * 1.72 * scale, lift * 0.78 * scale, 0.15),
      new THREE.Vector3(direction * 1.43 * scale, lift * 0.02 * scale, 0.15),
      new THREE.Vector3(0, 0, 0.15),
    ];
    const outline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      addGlowMaterial(new THREE.LineBasicMaterial({ color: 0xffe28b }), 0.64)
    );
    group.add(outline);

    [0.42, 0.68, 0.9].forEach((reach, index) => {
      const vein = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0.16),
          new THREE.Vector3(
            direction * (0.34 + index * 0.15) * scale,
            lift * (0.57 + index * 0.16) * scale,
            0.16
          ),
          new THREE.Vector3(
            direction * (1.22 + index * 0.18) * reach * scale,
            lift * (0.7 - index * 0.08) * scale,
            0.16
          ),
        ]),
        addGlowMaterial(new THREE.LineBasicMaterial({ color: 0xfff0b6 }), 0.82)
      );
      group.add(vein);
    });
  };

  addWing(-1, 1, 1);
  addWing(1, 1, 1);
  return group;
}

/**
 * Renders the downloaded CC0 butterfly GLB in the CSS-locked flight container.
 * The parent span retains the existing 7.166-second path; WebGL only supplies
 * the physical model, source skeleton motion, and the asymmetric side-profile
 * wingbeat required by the latest reference video.
 */
export function StoreSelectButterflyWebGL({
  className,
  motionSourceRef,
  tailAnchorRef,
  bodyGlowStyle,
}: ButterflyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeCanvasRenderer(canvas);
    } catch {
      return;
    }

    canvas.dataset.assetState = "loading";
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2.5, 2.5, 2.5, -2.5, 0.1, 100);
    camera.position.set(0, 0, 8);
    scene.add(new THREE.AmbientLight(0xffd59a, 1.5));

    const keyLight = new THREE.DirectionalLight(0xfff1c7, 3.2);
    keyLight.position.set(1.6, 2.8, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff781d, 4, 10);
    rimLight.position.set(-2, -1, 3);
    scene.add(rimLight);

    const flightRig = new THREE.Group();
    scene.add(flightRig);
    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    const wingBones: Array<{
      bone: THREE.Object3D;
      rest: THREE.Euler;
      side: 1 | -1;
    }> = [];
    const glowMaterials: Array<
      THREE.MeshStandardMaterial | THREE.MeshPhongMaterial
    > = [];
    let mixer: THREE.AnimationMixer | null = null;
    let frameId = 0;
    let disposed = false;
    let modelReady = false;
    let wingGlowGroup: THREE.Group | null = null;
    let butterflyModel: THREE.Group | null = null;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width < 1 || height < 1) return;
      const aspect = width / height;
      const halfHeight = 2.5;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    loader.load(
      BUTTERFLY_GLB,
      gltf => {
        if (disposed) return;
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const dimensions = bounds.getSize(new THREE.Vector3());
        const largestDimension = Math.max(
          dimensions.x,
          dimensions.y,
          dimensions.z,
          0.001
        );
        const scale = 7.6 / largestDimension;

        model.scale.setScalar(scale);
        model.position.set(0, -0.05, 0);
        model.rotation.set(0, MODEL_BASE_Y, 0);
        model.traverse(object => {
          if (/^(Leg|IK-Leg|Foot|Toe)/.test(object.name)) {
            object.visible = false;
          }
          if (object instanceof THREE.Mesh) {
            object.castShadow = false;
            object.receiveShadow = false;
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach(material => {
              if (
                "color" in material &&
                material.color instanceof THREE.Color
              ) {
                material.color.set(0xffc978);
              }
              if (
                material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhongMaterial
              ) {
                material.emissive.set(0xff8d24);
                material.emissiveMap = material.map;
                material.emissiveIntensity = 1.35;
                if (object instanceof THREE.SkinnedMesh) {
                  const legBoneIndices = object.skeleton.bones
                    .map((bone, index) =>
                      /^(Leg|IK-Leg|Foot|Toe)/.test(bone.name) ? index : -1
                    )
                    .filter(index => index >= 0);
                  stripLegTriangles(object, legBoneIndices);
                  installLegAndUnderbodyMask(material, legBoneIndices);
                }
                glowMaterials.push(material);
              }
              if ("roughness" in material) material.roughness = 0.24;
              material.transparent = true;
              material.opacity = 0.96;
              material.alphaTest = 0.08;
              material.depthWrite = false;
              material.side = THREE.DoubleSide;
            });
          }
          if (object.name.startsWith("Wing.")) {
            wingBones.push({
              bone: object,
              rest: object.rotation.clone(),
              side: object.name.endsWith("_L") ? -1 : 1,
            });
          }
        });

        const flyingClip = gltf.animations.find(clip => clip.name === "Flying");
        if (flyingClip) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(flyingClip);
          action.enabled = true;
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }
        flightRig.add(model);
        butterflyModel = model;
        wingGlowGroup = makeGoldenWingGlowGroup();
        wingGlowGroup.position.set(0, 0, 0.12);
        model.add(wingGlowGroup);
        modelReady = true;
        canvas.dataset.assetState = "loaded";
      },
      undefined,
      () => {
        canvas.dataset.assetState = "failed";
      }
    );

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const progress = getCycleProgress(motionSourceRef.current);
      if (mixer) mixer.update(delta);

      if (modelReady) {
        // The CC0 model supplies the real wing geometry and rig.  The reference
        // video specifies a gentle +60° upstroke / -30° downstroke at 3–4Hz.
        const flapPhase =
          (Math.sin(elapsed * Math.PI * 7.1 - Math.PI / 2) + 1) / 2;
        const flapRadians = THREE.MathUtils.lerp(
          -Math.PI / 6,
          Math.PI / 3,
          flapPhase
        );
        wingBones.forEach(({ bone, rest, side }) => {
          bone.rotation.copy(rest);
          bone.rotation.z += side * flapRadians;
        });

        const activeFlight =
          progress !== null &&
          progress >= FLIGHT_START &&
          progress <= FLIGHT_END;
        const returnFacing =
          activeFlight && progress !== null
            ? THREE.MathUtils.smoothstep(progress, 0.41, 0.525)
            : 0;
        if (butterflyModel) {
          butterflyModel.rotation.y = MODEL_BASE_Y + returnFacing * Math.PI;
          butterflyModel.rotation.z = THREE.MathUtils.lerp(
            -THREE.MathUtils.degToRad(4),
            THREE.MathUtils.degToRad(13),
            returnFacing
          );
        }
        const wingGlow = activeFlight
          ? 1.12 + flapPhase * 0.76 + Math.sin(elapsed * 5.4) * 0.08
          : 0.58;
        glowMaterials.forEach(material => {
          material.emissiveIntensity = wingGlow;
        });
        if (wingGlowGroup) {
          const glowOpacity = activeFlight ? 0.42 + flapPhase * 0.5 : 0;
          wingGlowGroup.traverse(object => {
            const material = (object as THREE.Mesh | THREE.Line).material;
            if (material && !Array.isArray(material)) {
              material.opacity =
                Number(material.userData.glowBase ?? 0) * glowOpacity;
            }
          });
          const pulse = 1 + flapPhase * 0.045;
          wingGlowGroup.scale.set(pulse, pulse, 1);
        }
        rimLight.intensity = activeFlight ? 4.5 + flapPhase * 1.45 : 2.6;
        const bank = activeFlight
          ? Math.sin(
              ((progress - FLIGHT_START) / (FLIGHT_END - FLIGHT_START)) *
                Math.PI *
                2
            ) * THREE.MathUtils.degToRad(18)
          : 0;
        flightRig.rotation.z = bank;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    frameId = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      wingGlowGroup?.traverse(object => {
        if (object instanceof THREE.Line) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      renderer.dispose();
      if (tailAnchorRef.current)
        tailAnchorRef.current.dataset.webgl = "disposed";
    };
  }, [motionSourceRef, tailAnchorRef]);

  return (
    <span ref={motionSourceRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="store-select-webgl-butterfly-canvas" />
      <span
        className="store-select-butterfly-body-light"
        style={bodyGlowStyle}
        aria-hidden="true"
      />
      <span
        ref={tailAnchorRef}
        className="store-select-webgl-butterfly-tail-anchor"
      />
    </span>
  );
}

/**
 * Uses a single WebGL point cloud instead of hundreds of DOM nodes.  Every
 * emitted particle takes its screen position from the transformed 3D
 * butterfly tail anchor, then keeps its own inertia, radial drift, downward
 * fall and high-frequency sparkle after it detaches.
 */
export function StoreSelectGoldDustWebGL({
  motionSourceRef,
  tailAnchorRef,
}: GoldDustProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeCanvasRenderer(canvas);
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
    camera.position.z = 8;

    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const seeds = new Float32Array(particleCount);
    const stars = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    const ages = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);
    const velocities = Array.from(
      { length: particleCount },
      () => new THREE.Vector2()
    );
    ages.fill(Number.POSITIVE_INFINITY);
    positions.fill(1000);

    for (let index = 0; index < particleCount; index += 1) {
      seeds[index] = Math.random();
      sizes[index] = 1;
    }

    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(
      THREE.DynamicDrawUsage
    );
    const alphaAttribute = new THREE.BufferAttribute(alphas, 1).setUsage(
      THREE.DynamicDrawUsage
    );
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aStar", new THREE.BufferAttribute(stars, 1));
    geometry.setAttribute("aAlpha", alphaAttribute);

    const starTexture = new THREE.TextureLoader().load(GOLD_DUST_STAR);
    starTexture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
        uTime: { value: 0 },
        uStarTexture: { value: starTexture },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSeed;
        attribute float aStar;
        attribute float aAlpha;
        uniform float uPixelRatio;
        varying float vSeed;
        varying float vStar;
        varying float vAlpha;
        void main() {
          vSeed = aSeed;
          vStar = aStar;
          vAlpha = aAlpha;
          gl_PointSize = max(0.72, aSize * 1.45 * uPixelRatio);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uStarTexture;
        varying float vSeed;
        varying float vStar;
        varying float vAlpha;
        void main() {
          vec2 point = gl_PointCoord - vec2(.5);
          float radius = length(point) * 2.0;
          float softDot = 1.0 - smoothstep(.10, 1.0, radius);
          float starShape = texture2D(uStarTexture, gl_PointCoord).a;
          float shape = mix(softDot, max(softDot, starShape), step(.5, vStar));
          float twinkle = .58 + .42 * sin(uTime * (8.0 + vSeed * 9.0) + vSeed * 37.0);
          vec3 warmGold = mix(vec3(1.0, .54, .10), vec3(1.0, .97, .77), twinkle);
          gl_FragColor = vec4(warmGold, shape * vAlpha * twinkle);
        }
      `,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const clock = new THREE.Clock();
    const previousTail = new THREE.Vector2();
    let hasPreviousTail = false;
    let cursor = 0;
    let lastEmission = -Infinity;
    let frameId = 0;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width < 1 || height < 1) return;
      const aspect = width / height;
      const halfHeight = 3;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const viewWidth = camera.right - camera.left;
      const viewHeight = camera.top - camera.bottom;
      return new THREE.Vector2(
        camera.left + ((clientX - rect.left) / width) * viewWidth,
        camera.top - ((clientY - rect.top) / height) * viewHeight
      );
    };

    const emit = (origin: THREE.Vector2, direction: THREE.Vector2) => {
      for (let batchIndex = 0; batchIndex < 4; batchIndex += 1) {
        const index = cursor % particleCount;
        cursor += 1;
        const random = Math.random();
        const isStar = batchIndex === 0 && random > 0.74;
        const large = batchIndex === 0;
        const tiny = batchIndex >= 2;
        const size = large
          ? 3 + random * 2
          : tiny
            ? 0.65 + random * 1.1
            : 1.3 + random * 1.5;
        const outward = new THREE.Vector2(
          (Math.random() - 0.5) * 0.32,
          (Math.random() - 0.5) * 0.22
        );
        const inherited = direction.clone().multiplyScalar(0.2 + random * 0.08);
        const velocity = velocities[index];
        velocity.copy(inherited).add(outward);

        positions[index * 3] = origin.x + (Math.random() - 0.5) * 0.06;
        positions[index * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.06;
        positions[index * 3 + 2] = 0;
        sizes[index] = size;
        stars[index] = isStar ? 1 : 0;
        alphas[index] = 0.1;
        ages[index] = 0;
        lifetimes[index] = 1.25 + random * 0.42;
      }
      positionAttribute.needsUpdate = true;
      alphaAttribute.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aStar.needsUpdate = true;
    };

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      material.uniforms.uTime.value = elapsed;
      const progress = getCycleProgress(motionSourceRef.current);
      const tailAnchor = tailAnchorRef.current;

      if (
        tailAnchor &&
        progress !== null &&
        progress >= FLIGHT_START &&
        progress <= FLIGHT_END
      ) {
        const tailRect = tailAnchor.getBoundingClientRect();
        const tail = toWorld(
          tailRect.left + tailRect.width / 2,
          tailRect.top + tailRect.height / 2
        );
        const direction = hasPreviousTail
          ? tail.clone().sub(previousTail).normalize()
          : new THREE.Vector2(-1, 0);
        if (elapsed - lastEmission >= 0.022) {
          emit(
            tail,
            Number.isFinite(direction.x) ? direction : new THREE.Vector2(-1, 0)
          );
          lastEmission = elapsed;
        }
        previousTail.copy(tail);
        hasPreviousTail = true;
      } else {
        hasPreviousTail = false;
      }

      for (let index = 0; index < particleCount; index += 1) {
        if (!Number.isFinite(ages[index])) continue;
        ages[index] += delta;
        const lifespan = lifetimes[index];
        if (ages[index] >= lifespan) {
          ages[index] = Number.POSITIVE_INFINITY;
          positions[index * 3] = 1000;
          alphas[index] = 0;
          continue;
        }

        const lifeProgress = ages[index] / lifespan;
        const velocity = velocities[index];
        velocity.y -= 0.22 * delta;
        velocity.x *= 0.995;
        positions[index * 3] += velocity.x * delta;
        positions[index * 3 + 1] += velocity.y * delta;
        alphas[index] =
          Math.sin(lifeProgress * Math.PI) * (0.66 + seeds[index] * 0.34);
      }
      positionAttribute.needsUpdate = true;
      alphaAttribute.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      starTexture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [motionSourceRef, tailAnchorRef]);

  return (
    <canvas
      ref={canvasRef}
      className="store-select-webgl-gold-dust-canvas"
      aria-hidden="true"
    />
  );
}
