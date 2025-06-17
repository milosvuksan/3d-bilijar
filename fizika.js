import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from '../WebGLUtils.js';


const balls=[
    {x:0, y:0, vx:0,vy:0, r:2},//v je brzina, r je poluprecnik
    {x:20, y:20, vx:0,vy:0, r:2}// nakon sto proradi za v dodati vx i vy kao brzine po x i y osi
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

function ballCollideWithTable(ball, table){
    const minX=table.x-table.width/2+ball.r;
    const maxX=table.x+table.width/2-ball.r;

    const minY=table.y-table.height/2+ball.r;
    const maxY=table.y+table.height/2-ball.r;

    const minZ=table.z-table.depth/2+ball.r;
    const maxZ=table.z+table.depth/2-ball.r;

    //leva ivica
    if(ball.x==minx || ball.x==maxX || ball.y==minY ||ball.y==maxY ){
        return true
    }
    return false
}
function oneBallMove(ball, table){
    const minX=table.x-table.width/2+ball.r;
    const maxX=table.x+table.width/2-ball.r;

    const minY=table.y-table.height/2+ball.r;
    const maxY=table.y+table.height/2-ball.r;

    const minZ=table.z-table.depth/2+ball.r;
    const maxZ=table.z+table.depth/2-ball.r;

    if(ball.x==minx || ball.x==maxX)ball.vy=-ball.vy;
    else ball.vx=ball.vx;
    
}
function postCollide(ball1, ball2){
    let vx1=ball2.vx-ball1.vx;
    let vy1=ball2.vy-ball1.vy;
    let vx2=-vx1;
    let vy2=-vy1;
    return vx1, vy1, vx2, vy2;
}
