precision highp float;
precision highp int;

#include "engine-uniforms.fsh"
#include "structs.vsh"

uniform highp usampler2D infos;
uniform highp usampler2D walls;
uniform highp usampler2D sectors;

in vec4 aPos12;
in vec4 aPos3Sec;

out vec3 tc;
out vec4 parallax;
flat out ivec4 params;
flat out pic_t picInfo;

vec3 getTc(vec2 pos, sector_t sector, vec4 orient, pic_t pic, bool ceiling) {
  vec2 pan = vec2(ceiling ? sector.ceilingFloorPan.xy : sector.ceilingFloorPan.zw) / vec2(256.0);
  uint cstat = ceiling ? sector.ceilingFloorCstat.x : sector.ceilingFloorCstat.y;
  float heinum = angscale(ceiling ? sector.ceilingFloorHeinumZ.x : sector.ceilingFloorHeinumZ.z);
  bool alignToFirstWall = sector_cstat_alignToFirstWall(cstat);
  bool swapXY = sector_cstat_swapXY(cstat);
  vec2 angFactor = vec2(1.0, alignToFirstWall ? sqrt(1.0 + heinum * heinum) : 1.0);
  vec2 flip = vec2(sector_cstat_xflip(cstat) ? -1.0 : 1.0, sector_cstat_yflip(cstat) ? -1.0 : 1.0);
  vec2 scale = vec2(sector_cstat_doubleSmooshiness(cstat) ? 8.0 : 16.0) * pic.sizeOff.xy * flip / (swapXY ? angFactor.yx : angFactor);
  vec2 yFlipPos = pos * vec2(1.0, -1.0);
  if (alignToFirstWall) {
    yFlipPos -= orient.xy * vec2(1.0, -1.0);
    float ang = atan(orient.w, orient.z);
    vec4 orig = vec4(sin(ang), cos(ang), -cos(ang), sin(ang));
    yFlipPos = vec2(-dot(yFlipPos, orig.zw), -dot(yFlipPos, orig.xy));
  }
  vec2 inPos = swapXY ? yFlipPos.yx : yFlipPos.xy;
  return vec3(inPos / scale + pan, 1.0);
}

vec2 getPos() {
  bool hasCeiling = (uint(aPos3Sec.w) & uint(1)) == uint(1);
  bool hasFloor = (uint(aPos3Sec.w) >> uint(1) & uint(1)) == uint(1);
  if (gl_VertexID == 0) return hasCeiling ? aPos12.xy : vec2(0.0);
  else if (gl_VertexID == 1) return hasCeiling ? aPos12.zw : vec2(0.0);
  else if (gl_VertexID == 2) return hasCeiling ? aPos3Sec.xy : vec2(0.0);
  else if (gl_VertexID == 3) return hasFloor ? aPos3Sec.xy : vec2(0.0);
  else if (gl_VertexID == 4) return hasFloor ? aPos12.zw : vec2(0.0);
  else if (gl_VertexID == 5) return hasFloor ? aPos12.xy : vec2(0.0);
}

void main() {
  sector_t sector = loadSector(sectors, uint(aPos3Sec.z));
  wall_t firstWall = loadWall(walls, sector.wallPtrNum.x);
  wall_t secondWall = loadWall(walls, firstWall.point2);
  vec4 orient = vec4(firstWall.pos, normalize(secondWall.pos - firstWall.pos));
  bool ceiling = gl_VertexID <= 2;
  picInfo = loadPicInfo(infos, ceiling ? sector.ceilingFloorPicnum.x : sector.ceilingFloorPicnum.y, 0.0);

  vec2 pos = getPos();
  vec2 heinumZ = ceiling ? sector.ceilingFloorHeinumZ.xy : sector.ceilingFloorHeinumZ.zw;
  float z = calcZ(pos, heinumZ, orient);
  tc = getTc(pos, sector, orient, picInfo, ceiling);
  int shade = ceiling ? sector.ceilingFloorShade.x : sector.ceilingFloorShade.y;
  int pal = int(ceiling ? sector.ceilingFloorPal.x : sector.ceilingFloorPal.y);
  bool isParallax = sector_cstat_parallaxing(ceiling ? sector.ceilingFloorCstat.x : sector.ceilingFloorCstat.y);
  params = ivec4(shade, pal, int(sector.visibility), 0);
  vec3 wpos = vec3(pos.x, z,  pos.y);
  vec4 finalPos = P * V * vec4(wpos, 1.0);
  gl_Position = isParallax ? applyParallax(finalPos) : finalPos;
  vec3 eyepos = (IV * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  parallax = vec4(wpos - eyepos,  isParallax ? 1.0 : 0.0);
}