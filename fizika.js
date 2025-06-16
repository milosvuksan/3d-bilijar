import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from '../WebGLUtils.js';


const balls=[
    {x:0, y:0, v:0, r:2},//v je brzina, r je poluprecnik
    {x:20, y:20, v:0, r:2}// nakon sto proradi za v dodati vx i vy kao brzine po x i y osi
    //Dodati pocetne koordinate lopti
]

function ballsCollide(ball1, ball2){
    const d=Math.sqrt((ball1.x-ball2.x)*(ball1.x-ball2.x)-(ball1.y-ball2.y)*(ball1.y-ball2.y));
    if(d<ball1.r*2){
        return true;
    }
    return false;
}
function twoBallsMove(ball1, ball2){ // posto sudari nisu 100% elasticni i gubi otp 4-10% energije u sudaru
    if(ballsCollide(ball1, ball2)){
        v=ball1.v;
        ball1.v=ball2.v;
        ball2.v=v;
    }
}
// }
// function ballCollideWithTable(ball, table){
//     const minX=table.x-table.width/2+ball.r;
//     const maxX=table.x+table.width/2-ball.r;

//     const minY=table.y-table.height/2+ball.r;
//     const maxY=table.y+table.height/2-ball.r;

//     const minZ=table.z-table.depth/2+ball.r;
//     const maxZ=table.z+table.depth/2-ball.r;

//     //leva ivica
//     if((ball.x))



