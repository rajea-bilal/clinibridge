/// <reference types="@react-three/fiber" />

import { PerspectiveCamera } from "@react-three/drei";
import type {} from "@react-three/fiber";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { config } from "@root/config";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  DollarSign,
  ExternalLink,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import type React from "react";
import {
  type FC,
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";

// Set to false to remove the launching soon banner
const IS_LAUNCHING_SOON = false;

// Register Three.js objects with react-three-fiber
extend({
  Mesh: THREE.Mesh,
  Group: THREE.Group,
  DirectionalLight: THREE.DirectionalLight,
  AmbientLight: THREE.AmbientLight,
  Color: THREE.Color,
});

// Type declarations for Three.js JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      directionalLight: any;
      ambientLight: any;
      color: any;
    }
  }
}

// ============================================================================
// BEAMS COMPONENT (3D Background)
// ============================================================================

type UniformValue = THREE.IUniform<unknown> | unknown;

interface ExtendMaterialConfig {
  header: string;
  vertexHeader?: string;
  fragmentHeader?: string;
  material?: THREE.MeshPhysicalMaterialParameters & { fog?: boolean };
  uniforms?: Record<string, UniformValue>;
  vertex?: Record<string, string>;
  fragment?: Record<string, string>;
}

type ShaderWithDefines = THREE.ShaderLibShader & {
  defines?: Record<string, string | number | boolean>;
};

function extendMaterial<T extends THREE.Material = THREE.Material>(
  BaseMaterial: new (params?: THREE.MaterialParameters) => T,
  cfg: ExtendMaterialConfig
): THREE.ShaderMaterial {
  const physical = THREE.ShaderLib.physical as ShaderWithDefines;
  const {
    vertexShader: baseVert,
    fragmentShader: baseFrag,
    uniforms: baseUniforms,
  } = physical;
  const baseDefines = physical.defines ?? {};

  const uniforms: Record<string, THREE.IUniform> =
    THREE.UniformsUtils.clone(baseUniforms);

  const defaults = new BaseMaterial(cfg.material || {}) as T & {
    color?: THREE.Color;
    roughness?: number;
    metalness?: number;
    envMap?: THREE.Texture;
    envMapIntensity?: number;
  };

  if (defaults.color) uniforms.diffuse.value = defaults.color;
  if ("roughness" in defaults) uniforms.roughness.value = defaults.roughness;
  if ("metalness" in defaults) uniforms.metalness.value = defaults.metalness;
  if ("envMap" in defaults) uniforms.envMap.value = defaults.envMap;
  if ("envMapIntensity" in defaults)
    uniforms.envMapIntensity.value = defaults.envMapIntensity;

  Object.entries(cfg.uniforms ?? {}).forEach(([key, u]) => {
    uniforms[key] =
      u !== null && typeof u === "object" && "value" in u
        ? (u as THREE.IUniform<unknown>)
        : ({ value: u } as THREE.IUniform<unknown>);
  });

  let vert = `${cfg.header}\n${cfg.vertexHeader ?? ""}\n${baseVert}`;
  let frag = `${cfg.header}\n${cfg.fragmentHeader ?? ""}\n${baseFrag}`;

  for (const [inc, code] of Object.entries(cfg.vertex ?? {})) {
    vert = vert.replace(inc, `${inc}\n${code}`);
  }

  for (const [inc, code] of Object.entries(cfg.fragment ?? {})) {
    frag = frag.replace(inc, `${inc}\n${code}`);
  }

  const mat = new THREE.ShaderMaterial({
    defines: { ...baseDefines },
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    lights: true,
    fog: !!cfg.material?.fog,
  });

  return mat;
}

const CanvasWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <Canvas className="relative h-full w-full" dpr={[1, 2]} frameloop="always">
    {children}
  </Canvas>
);

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.substring(0, 2), 16);
  const g = Number.parseInt(clean.substring(2, 4), 16);
  const b = Number.parseInt(clean.substring(4, 6), 16);
  return [r / 255, g / 255, b / 255];
};

const noise = `
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`;

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

function createStackedPlanesBufferGeometry(
  n: number,
  width: number,
  height: number,
  spacing: number,
  heightSegments: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const numVertices = n * (heightSegments + 1) * 2;
  const numFaces = n * heightSegments * 2;

  const positions = new Float32Array(numVertices * 3);
  const indices = new Uint32Array(numFaces * 3);
  const uvs = new Float32Array(numVertices * 2);

  let vertexOffset = 0;
  let indexOffset = 0;
  let uvOffset = 0;

  const totalWidth = n * width + (n - 1) * spacing;
  const xOffsetBase = -totalWidth / 2;

  for (let i = 0; i < n; i++) {
    const xOffset = xOffsetBase + i * (width + spacing);
    const uvXOffset = Math.random() * 300;
    const uvYOffset = Math.random() * 300;

    for (let j = 0; j <= heightSegments; j++) {
      const y = height * (j / heightSegments - 0.5);
      const v0 = [xOffset, y, 0];
      const v1 = [xOffset + width, y, 0];

      positions.set([...v0, ...v1], vertexOffset * 3);

      const uvY = j / heightSegments;
      uvs.set(
        [uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset],
        uvOffset
      );

      if (j < heightSegments) {
        const a = vertexOffset,
          b = vertexOffset + 1,
          c = vertexOffset + 2,
          d = vertexOffset + 3;
        indices.set([a, b, c, c, b, d], indexOffset);
        indexOffset += 6;
      }

      vertexOffset += 2;
      uvOffset += 4;
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}

const MergedPlanes = forwardRef<
  THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  {
    material: THREE.ShaderMaterial;
    width: number;
    count: number;
    height: number;
  }
>(({ material, width, count, height }, ref) => {
  const mesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(
    null!
  );

  useImperativeHandle(ref, () => mesh.current);

  const geometry = useMemo(
    () => createStackedPlanesBufferGeometry(count, width, height, 0, 100),
    [count, width, height]
  );

  useFrame((_, delta) => {
    mesh.current.material.uniforms.time.value += 0.1 * delta;
  });

  // @ts-expect-error - Three.js JSX element from react-three-fiber
  return <mesh geometry={geometry} material={material} ref={mesh} />;
});

MergedPlanes.displayName = "MergedPlanes";

const PlaneNoise = forwardRef<
  THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  {
    material: THREE.ShaderMaterial;
    width: number;
    count: number;
    height: number;
  }
>((props, ref) => (
  <MergedPlanes
    count={props.count}
    height={props.height}
    material={props.material}
    ref={ref}
    width={props.width}
  />
));

PlaneNoise.displayName = "PlaneNoise";

const DirLight: FC<{ position: [number, number, number]; color: string }> = ({
  position,
  color,
}) => {
  const dir = useRef<THREE.DirectionalLight>(null!);

  useEffect(() => {
    if (!dir.current) return;
    const cam = dir.current.shadow.camera as THREE.Camera & {
      top: number;
      bottom: number;
      left: number;
      right: number;
      far: number;
    };
    cam.top = 24;
    cam.bottom = -24;
    cam.left = -24;
    cam.right = 24;
    cam.far = 64;
    dir.current.shadow.bias = -0.004;
  }, []);

  return (
    <directionalLight
      color={color}
      intensity={1}
      position={position}
      ref={dir}
    />
  );
};

const Beams: FC<BeamsProps> = ({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
}) => {
  const meshRef = useRef<
    THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  >(null!);

  const beamMaterial = useMemo(
    () =>
      extendMaterial(THREE.MeshStandardMaterial, {
        header: `
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${noise}`,
        vertexHeader: `
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }

  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }

  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,
        fragmentHeader: "",
        vertex: {
          "#include <begin_vertex>":
            "transformed.z += getPos(transformed.xyz);",
          "#include <beginnormal_vertex>":
            "objectNormal = getNormal(position.xyz);",
        },
        fragment: {
          "#include <dithering_fragment>": `
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`,
        },
        material: { fog: true },
        uniforms: {
          diffuse: new THREE.Color(...hexToNormalizedRGB("#000000")),
          time: { shared: true, mixed: true, linked: true, value: 0 },
          roughness: 0.3,
          metalness: 0.3,
          uSpeed: { shared: true, mixed: true, linked: true, value: speed },
          envMapIntensity: 10,
          uNoiseIntensity: noiseIntensity,
          uScale: scale,
        },
      }),
    [speed, noiseIntensity, scale]
  );

  return (
    <CanvasWrapper>
      {/* @ts-expect-error - Three.js JSX element from react-three-fiber */}
      <group rotation={[0, 0, degToRad(rotation)]}>
        <PlaneNoise
          count={beamNumber}
          height={beamHeight}
          material={beamMaterial}
          ref={meshRef}
          width={beamWidth}
        />
        <DirLight color={lightColor} position={[0, 3, 10]} />
        {/* @ts-expect-error - Three.js JSX element from react-three-fiber */}
      </group>
      {/* @ts-expect-error - Three.js JSX element from react-three-fiber */}
      <ambientLight intensity={1} />
      {/* @ts-expect-error - Three.js JSX element from react-three-fiber */}
      <color args={["#000000"]} attach="background" />
      <PerspectiveCamera fov={30} makeDefault position={[0, 0, 20]} />
    </CanvasWrapper>
  );
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
  children: React.ReactNode;
}

const Button = ({
  variant = "default",
  size = "sm",
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-white text-black hover:bg-gray-100",
    outline:
      "border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30",
    ghost: "text-white/90 hover:text-white hover:bg-white/10",
  };

  const sizes = {
    sm: "h-9 px-4 py-2 text-sm",
    lg: "px-8 py-6 text-lg",
  };

  return (
    <button
      className={`group relative overflow-hidden rounded-full ${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center">{children}</span>
      <div className="absolute inset-0 -top-2 -bottom-2 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
    </button>
  );
};

// ============================================================================
// MAIN HERO COMPONENT
// ============================================================================

function DashboardButton() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await navigate({
      to: "/dashboard",
      search: { action: undefined, purchaseSuccess: undefined },
    });
    setIsLoading(false);
  };

  const buttonText = config.features.waitlist ? "Join Waitlist" : "Dashboard";

  return (
    <Button
      className="font-mono font-semibold"
      disabled={isLoading}
      onClick={handleClick}
      size="sm"
    >
      {buttonText}
      {isLoading ? (
        <Loader2 size={16} className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight size={16} className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Hero
 *
 * A mesmerizing hero section featuring animated 3D light beams with glassmorphic navigation.
 * Perfect for modern SaaS, creative agencies, and tech startups looking to make a bold first impression.
 *
 * Features:
 * - Animated 3D light beams background
 * - Glassmorphic pill-shaped navigation
 * - Shimmer button effects
 * - Fully responsive design
 * - Black & white aesthetic
 */
export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-hidden bg-black sm:h-screen">
      {/* Fixed Warning Banner - Conditionally visible at top */}
      {IS_LAUNCHING_SOON && (
        <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center border-amber-500/20 border-b bg-amber-500/10 px-4 py-2.5 backdrop-blur-xl">
          <div className="inline-flex items-center font-mono text-amber-400 text-xs sm:text-sm">
            <span className="relative mr-2 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            Launching soon
          </div>
        </div>
      )}

      {/* Beams Background */}
      <div className="absolute inset-0 z-0">
        <Beams
          beamHeight={18}
          beamNumber={15}
          beamWidth={2.5}
          lightColor="#ffffff"
          noiseIntensity={2}
          rotation={43}
          scale={0.15}
          speed={2.5}
        />
      </div>

      {/* Glassmorphic Navbar */}
      <nav
        className={`relative z-20 w-full ${IS_LAUNCHING_SOON ? "pt-[42px]" : "pt-4"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Brand Logo */}
            <div className="flex items-center">
              <a className="flex items-center" href="/">
                <img
                  alt={config.metadata.siteName}
                  className="h-10 w-auto sm:h-14"
                  src={config.metadata.logo}
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-4 md:flex">
              <button
                className="group"
                onClick={() => {
                  const element = document.getElementById("calculator");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              >
                <Button className="font-mono" size="sm" variant="ghost">
                  <DollarSign size={16} className="mr-2 h-4 w-4" />
                  Estimate Cost-To-Run
                </Button>
              </button>
              <a
                className="group"
                href={config.metadata.social.discord}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button className="font-mono" size="sm" variant="ghost">
                  <svg
                    aria-hidden="true"
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Community
                  <ExternalLink size={16} className="ml-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
              </a>
              <a
                className="group"
                href="https://yugen-fumadocs.vercel.app/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button className="font-mono" size="sm" variant="ghost">
                  <BookOpen size={16} className="mr-2 h-4 w-4" />
                  Docs
                  <ExternalLink size={16} className="ml-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
              </a>
              <DashboardButton />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <DashboardButton />
              <Button
                aria-label="Toggle menu"
                className="font-mono"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                size="sm"
                variant="ghost"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="h-5 w-5" />
                ) : (
                  <Menu size={20} className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 space-y-2 border-white/10 border-t pb-4 md:hidden">
              <button
                className="block w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  const element = document.getElementById("calculator");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              >
                <Button
                  className="w-full justify-start font-mono"
                  size="sm"
                  variant="ghost"
                >
                  <DollarSign size={16} className="mr-2 h-4 w-4" />
                  Estimate Cost-To-Run
                </Button>
              </button>
              <a
                className="block"
                href={config.metadata.social.discord}
                onClick={() => setMobileMenuOpen(false)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button
                  className="w-full justify-start font-mono"
                  size="sm"
                  variant="ghost"
                >
                  <svg
                    aria-hidden="true"
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Community
                  <ExternalLink size={16} className="ml-auto h-4 w-4" />
                </Button>
              </a>
              <a
                className="block"
                href="https://yugen-fumadocs.vercel.app/"
                onClick={() => setMobileMenuOpen(false)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button
                  className="w-full justify-start font-mono"
                  size="sm"
                  variant="ghost"
                >
                  <BookOpen size={16} className="mr-2 h-4 w-4" />
                  Docs
                  <ExternalLink size={16} className="ml-auto h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-1 items-center pt-8 pb-40 sm:pt-0 sm:pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <a
              className="mb-6 inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-white/90 text-xs backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10 sm:mb-10 sm:px-5 sm:py-2.5 sm:text-sm"
              href="https://accelerator.codeandcreed.tech/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="relative mr-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="whitespace-nowrap">
                Powering Code&Creed Startups
              </span>
            </a>

            {/* Main Heading */}
            <h1 className="mb-6 px-4 font-bold font-mono text-3xl text-white tracking-tight sm:mb-8 sm:px-0 sm:text-4xl md:text-5xl lg:text-6xl">
              Build Highly-Scalable
              <br />
              Web Apps
              <br />
              <span className="text-white/80 text-xl sm:text-2xl md:text-3xl">
                (Without Breaking the Bank)
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl px-4 font-mono text-sm text-white/70 leading-7 sm:mb-12 sm:px-0 sm:text-base lg:text-lg">
              The most complete TypeScript starter kit - combining the best of
              TanStack Start, Convex, Polar, Resend, and Cloudflare. Everything
              you need, nothing you don't.
            </p>

            {/* Stats */}
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-4 pt-4 pb-16 sm:grid-cols-3 sm:gap-12 sm:px-0 sm:pt-8 sm:pb-0">
              <div className="text-center">
                <div className="mb-1 font-bold font-mono text-3xl text-white sm:mb-2 sm:text-4xl">
                  100%
                </div>
                <div className="font-mono text-white/60 text-xs sm:text-sm">
                  Type-safe
                </div>
              </div>
              <div className="text-center">
                <div className="mb-1 font-bold font-mono text-3xl text-white sm:mb-2 sm:text-4xl">
                  5+
                </div>
                <div className="font-mono text-white/60 text-xs sm:text-sm">
                  Integrations
                </div>
              </div>
              <div className="text-center">
                <div className="mb-1 font-bold font-mono text-3xl text-white sm:mb-2 sm:text-4xl">
                  &lt;10min
                </div>
                <div className="font-mono text-white/60 text-xs sm:text-sm">
                  Setup Time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Powered By - Visible at bottom of initial viewport */}
      <div className="relative z-10 pb-8 sm:pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <span className="font-medium font-mono text-white/50 text-xs tracking-wider">
              POWERED BY
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="font-medium font-mono text-sm text-white/80">
                Convex
              </span>
              <span className="text-white/30">•</span>
              <span className="font-medium font-mono text-sm text-white/80">
                Polar
              </span>
              <span className="text-white/30">•</span>
              <span className="font-medium font-mono text-sm text-white/80">
                Resend
              </span>
              <span className="text-white/30">•</span>
              <span className="font-medium font-mono text-sm text-white/80">
                BetterAuth
              </span>
              <span className="text-white/30">•</span>
              <span className="font-medium font-mono text-sm text-white/80">
                Cloudflare
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
    </div>
  );
}
