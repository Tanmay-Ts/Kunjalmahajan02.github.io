import * as THREE from 'three';

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld=(modelMatrix*vec4(position,1.0)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    gl_Position.z=gl_Position.w;
  }
`;
const SKY_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uZenith,uUpper,uHorizon,uLower,uSun,uRose;
  varying vec3 vWorld;
  float hash21(vec2 p) {
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
  }
  float noise2(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),
      mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0)),f.x),f.y);
  }
  float wisps(vec2 p) {
    return noise2(p)*0.57+noise2(p*2.03+11.4)*0.28+noise2(p*4.07+23.2)*0.14;
  }
  void main() {
    vec3 direction=normalize(vWorld-cameraPosition);
    float height=direction.y+0.23;
    float longitude=atan(direction.x,-direction.z);
    vec3 colour=mix(uHorizon,uUpper,smoothstep(-0.18,0.25,height));
    colour=mix(colour,uZenith,smoothstep(0.13,0.72,height));
    colour=mix(colour,uLower,1.0-smoothstep(-0.65,-0.13,height));
    vec3 sunDirection=normalize(vec3(-0.65,-0.05,-0.85));
    float sunDistance=length(direction-sunDirection);
    float halo=exp(-sunDistance*sunDistance*5.0);
    colour=mix(colour,uSun,halo*0.49);
    colour+=uRose*exp(-sunDistance*sunDistance*22.0)*0.12;
    float altitude=smoothstep(-0.10,0.03,height)*(1.0-smoothstep(0.6,0.82,height));
    if (altitude>0.001) {
      float n=wisps(vec2(longitude*3.6,height*16.0)+vec2(uTime*0.0018,3.4));
      float cloud=smoothstep(0.5,0.72,n)*altitude;
      colour=mix(colour,mix(uRose,uSun,halo*0.55+n*0.36),cloud*0.58);
    }
    float disc=1.0-smoothstep(0.016,0.022,sunDistance);
    colour=mix(colour,uSun*1.3,disc);
    colour+=uSun*exp(-sunDistance*sunDistance*330.0)*0.13;
    gl_FragColor=vec4(colour,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const CLOUD_VERTEX = /* glsl */ `
  uniform mat4 uInverseModel;
  varying vec3 vOrigin,vDirection;
  void main() {
    vOrigin=(uInverseModel*vec4(cameraPosition,1.0)).xyz;
    vDirection=position-vOrigin;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;
const CLOUD_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime,uSeed,uWarmth,uOpacity;
  uniform vec3 uShadow,uMid,uLight;
  varying vec3 vOrigin,vDirection;

  float hash31(vec3 p) {
    p=fract(p*0.1031);
    p+=dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
  }
  float noise3(vec3 p) {
    vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float turbulence(vec3 p) {
    return noise3(p)*0.59+noise3(p*2.07+13.3)*0.28+noise3(p*4.17+29.7)*0.13;
  }
  float ellipsoid(vec3 p,vec3 centre,vec3 radius) {
    vec3 q=(p-centre)/radius;
    return 1.0-dot(q,q);
  }
  float softMax(float a,float b,float k) {
    float h=max(k-abs(a-b),0.0)/k;
    return max(a,b)+h*h*k*0.25;
  }
  // A union of inhabited volumes, not a surface texture: a camera ray samples
  // real front-to-back density, and light traverses the same rounded masses.
  float form(vec3 p) {
    float variation=sin(uSeed*2.71)*0.055;
    float d=ellipsoid(p,vec3(-0.44,-0.12,0.0),vec3(0.44,0.43,0.52));
    d=softMax(d,ellipsoid(p,vec3(-0.08,0.13+variation,-0.05),vec3(0.46,0.61,0.55)),0.24);
    d=softMax(d,ellipsoid(p,vec3(0.37,0.03,0.04),vec3(0.42,0.49,0.52)),0.24);
    d=softMax(d,ellipsoid(p,vec3(0.68,-0.18,-0.05),vec3(0.29,0.32,0.4)),0.2);
    d=softMax(d,ellipsoid(p,vec3(-0.71,-0.2,-0.06),vec3(0.28,0.3,0.39)),0.2);
    d=softMax(d,ellipsoid(p,vec3(0.0,-0.24,0.01),vec3(0.72,0.3,0.51)),0.2);
    return d;
  }
  float baseDensity(vec3 p) { return smoothstep(-0.05,0.5,form(p)); }
  float densityAt(vec3 p) {
    float field=form(p);
    if(field < -0.12) return 0.0;
    vec3 offset=vec3(uSeed*3.19,uSeed*1.73,uSeed*5.41)+vec3(uTime*0.012,0.0,uTime*0.004);
    float noise=turbulence(p*3.6+offset);
    return smoothstep(-0.04,0.51,field+(noise-0.53)*0.29);
  }
  vec2 intersectBox(vec3 origin,vec3 direction) {
    vec3 inv=1.0/direction;
    vec3 t0=(-vec3(0.5)-origin)*inv;
    vec3 t1=(vec3(0.5)-origin)*inv;
    vec3 lo=min(t0,t1),hi=max(t0,t1);
    return vec2(max(max(lo.x,lo.y),lo.z),min(min(hi.x,hi.y),hi.z));
  }
  void main() {
    vec3 ray=normalize(vDirection);
    vec2 bounds=intersectBox(vOrigin,ray);
    float start=max(bounds.x,0.0), finish=bounds.y;
    if (start >= finish) discard;
    const int STEPS=20;
    float stepSize=(finish-start)/float(STEPS);
    float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    float distance=start+stepSize*(0.3+jitter*0.4);
    float transmission=1.0;
    vec3 accumulated=vec3(0.0);
    vec3 lightDirection=normalize(vec3(-0.65,0.9,0.25));
    for(int i=0;i<STEPS;i++) {
      vec3 point=(vOrigin+ray*distance)*2.0;
      float density=densityAt(point);
      if(density > 0.005) {
        // The upper-left density probes provide soft self-shadowing rather
        // than a noisy surface normal or a cartoon outline around each lobe.
        float shadow=baseDensity(point+lightDirection*0.19)*1.6;
        shadow+=baseDensity(point+lightDirection*0.43)*1.0;
        float sunlight=exp(-shadow)*0.88+0.12;
        float upper=smoothstep(-0.45,0.55,point.y);
        float light=clamp(sunlight*0.8+upper*0.2,0.0,1.0);
        vec3 colour=mix(uShadow,uMid,smoothstep(0.1,0.58,light));
        colour=mix(colour,uLight,smoothstep(0.45,0.95,light));
        colour=mix(colour,uLight,uWarmth*sunlight*0.18);
        float opacity=(1.0-exp(-density*stepSize*10.8))*uOpacity;
        accumulated+=transmission*opacity*colour;
        transmission*=1.0-opacity;
        if(transmission < 0.025) break;
      }
      distance+=stepSize;
    }
    float alpha=1.0-transmission;
    if(alpha < 0.012) discard;
    gl_FragColor=vec4(accumulated/max(alpha,0.001),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createAtmosphere() {
  const group=new THREE.Group();
  group.name='Living sunset and volumetric cloud sea';
  const time={value:0};
  const resources=[];
  const cloudMeshes=[];
  const skyMaterial=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,toneMapped:false,fog:false,
    uniforms:{
      uTime:time,
      uZenith:{value:new THREE.Color('#898eb9')},
      uUpper:{value:new THREE.Color('#c4a9c9')},
      uHorizon:{value:new THREE.Color('#fbd1a4')},
      uLower:{value:new THREE.Color('#b9a0ce')},
      uSun:{value:new THREE.Color('#fff2bd')},
      uRose:{value:new THREE.Color('#efa9b3')},
    },vertexShader:SKY_VERTEX,fragmentShader:SKY_FRAGMENT,
  });
  const skyGeometry=new THREE.SphereGeometry(205,32,20);
  const sky=new THREE.Mesh(skyGeometry,skyMaterial);
  sky.name='Procedural sunset, visible sun and cirrus';
  sky.renderOrder=-100; sky.frustumCulled=false;
  group.add(sky); resources.push(skyGeometry,skyMaterial);

  // Twelve genuine 3D bounds: distant cumulus rise behind the islands, while
  // the lower banks surround their tips and waterfalls. Entrance paths are clear.
  const banks=[
    [-42,0,-66,35,23,27],[-12,-2,-79,38,25,29],[22,2,-72,39,26,29],[55,3,-62,35,25,27],
    [-32,-11,-11,23,13,17],[0,-16,-35,33,18,24],[39,-10,-7,26,15,19],
    [-12,-17,11,25,14,19],[16,-16,10,25,14,19],
    [-39,-12,24,28,17,21],[0,-22,30,32,17,23],[34,-17,27,31,18,22],
  ];
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  resources.push(boxGeometry);
  banks.forEach(([x,y,z,width,height,depth],index) => {
    const material=new THREE.ShaderMaterial({
      side:THREE.BackSide,transparent:true,depthWrite:false,depthTest:true,
      toneMapped:false,fog:false,
      uniforms:{
        uTime:time,
        uInverseModel:{value:new THREE.Matrix4()},
        uSeed:{value:index*1.739+0.83},
        uWarmth:{value:1-THREE.MathUtils.smoothstep(x,-55,55)},
        uOpacity:{value:0.97},
        uShadow:{value:new THREE.Color('#8e7ba8')},
        uMid:{value:new THREE.Color('#d4acc9')},
        uLight:{value:new THREE.Color('#ffe8c4')},
      },vertexShader:CLOUD_VERTEX,fragmentShader:CLOUD_FRAGMENT,
    });
    const cloud=new THREE.Mesh(boxGeometry,material);
    cloud.name='Raymarched cumulus '+(index+1);
    cloud.position.set(x,y,z);
    cloud.scale.set(width,height,depth);
    cloud.rotation.y=(index%3-1)*0.12;
    cloud.renderOrder=-20;
    cloud.onBeforeRender=() => material.uniforms.uInverseModel.value.copy(cloud.matrixWorld).invert();
    cloud.userData.basePosition=new THREE.Vector3(x,y,z);
    cloudMeshes.push(cloud); group.add(cloud); resources.push(material);
  });
  return {
    group,
    update(elapsed) {
      time.value=elapsed;
      cloudMeshes.forEach((cloud,index) => {
        const base=cloud.userData.basePosition;
        cloud.position.x=base.x+Math.sin(elapsed*0.012+index*1.7)*0.95;
        cloud.position.z=base.z+Math.sin(elapsed*0.008+index)*0.45;
      });
    },
    dispose() { resources.forEach((resource) => resource.dispose()); },
  };
}
