import {shaders} from './solana-shaders.js';
export async function createColorField(source){
const gl=source.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:false});if(!gl)throw Error('WebGL2 unavailable');let width=0,height=0,buffers=[],programs=[],texture;
const vertex=`#version 300 es
in vec2 aPosition;out vec2 vTextureCoord;out vec3 vVertexPosition;void main(){gl_Position=vec4(aPosition,0,1);vTextureCoord=aPosition*.5+.5;vVertexPosition=vec3(aPosition,0);}`;
function compile(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function makeTexture(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
function allocate(w,h){if(w===width&&h===height)return;width=w;height=h;source.width=w;source.height=h;buffers.forEach(b=>{gl.deleteFramebuffer(b.fbo);gl.deleteTexture(b.texture)});buffers=[0,1].map(()=>{const texture=makeTexture();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer unavailable');return{texture,fbo}})}
 programs=shaders.map(fragment=>{const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));const p={program};['uTexture','uTime','uResolution','uMousePos','uPos','uFrequency','uAmount'].forEach(k=>p[k]=gl.getUniformLocation(program,k));return p});
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);const triangle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,triangle);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);programs.forEach(p=>{const loc=gl.getAttribLocation(p.program,'aPosition');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0)});

texture=makeTexture();const {default:texturePng}=await import('./solana-color-field-data.js');const textureBytes=Uint8Array.from(atob(texturePng),c=>c.charCodeAt(0));
const image=await createImageBitmap(new Blob([textureBytes],{type:'image/png'}),{imageOrientation:'flipY',premultiplyAlpha:'none'});
gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);image.close();
return {paint(time,w,h){allocate(w,h);gl.viewport(0,0,w,h);let input=texture;
 programs.forEach((p,i)=>{const final=i===programs.length-1,target=buffers[i%2];gl.bindFramebuffer(gl.FRAMEBUFFER,final?null:target.fbo);gl.useProgram(p.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,input);gl.uniform1i(p.uTexture,0);gl.uniform1f(p.uTime,time*60*(i===0?.33:0));gl.uniform2f(p.uResolution,w,h);gl.uniform2f(p.uMousePos,.5,.5);gl.uniform2f(p.uPos,.5,.73);gl.uniform1f(p.uFrequency,1);gl.uniform1f(p.uAmount,1);gl.drawArrays(gl.TRIANGLES,0,3);input=target.texture});
}};
}
