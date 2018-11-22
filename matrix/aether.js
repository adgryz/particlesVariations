"use strict";
// CONSTS
const { PI, cos, sin, abs, sqrt, pow, floor, round, random, atan2 } = Math;
const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;
const TO_RAD = PI / 180;
// RANDS
const rand = n => n * random(); // res is in [0, n]
const randIn = (min, max) => rand(max - min) + min; // res is in [min, max]
const randRange = n => n - rand(2 * n); // for 7  res is in [-7,7]
// FADING t -> m
// t==0 => 0 , t==m/2 => 1/2 t==m => 1
const fadeIn = (t, m) => t / m; 
// t==0 => 1 ,  t==m/2 => 1/2  t==m => 0
const fadeOut = (t, m) =>  1 - t / m ; 
// t==0 => 0 , t==m/2 => 1 t==m => 0
const fadeInOut = (t, m) => t < m/2 ? fadeIn(t,m/2) : fadeOut(t-m/2,m/2) 
// CALC
const dist = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
const angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1); // ?
const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2; // ?
// CONFIGS
const particleCount = 1000;
const spawnRadius = 200;
const noiseSteps = 1;
// const particleCount = 1;
// const spawnRadius = 1;
// const noiseSteps = 0;

let canvas;
let ctx;
let center;
let tick;
let simplex;

// Data per one particle
let positions; // (x,y)
let velocities; // (vx,vy)
let lifeSpans; 
let sizes;
let hues;
let speeds;

function setup() {
	tick = 0;
	center = [];
	createCanvas();
	createParticles();
	draw();
}

function createParticles() {
	simplex = new SimplexNoise();
	positions = new Float32Array(particleCount * 2);
	velocities = new Float32Array(particleCount * 2);
	lifeSpans = new Float32Array(particleCount * 2); // why double ?
	speeds = new Float32Array(particleCount);
	hues = new Float32Array(particleCount);
	sizes = new Float32Array(particleCount);
	
	for (let i = 0; i < particleCount * 2; i += 2) {
		initParticle(i);
	}
}

function initParticle(i) {
	let iy, ih, randomRadius, randomAngle, cx, sy, x, y, rv, vx, vy;
	
	iy = i + 1; // indeks dla wsp. y
	ih = 0.5 * i | 0; // hmm nie wiem jak to dziala ale dla i = 0|1 ih = 0 , 2|3 ih = 1 itd
    // Get circle spawning camp
    randomRadius = rand(spawnRadius);
	randomAngle = rand(TAU);
	cx = cos(randomAngle);
	sy = sin(randomAngle);
	x = center[0] + cx * randomRadius;
    y = center[1] + sy * randomRadius; // this two will give us circle starting spawn 
    positions[i] = x;
	positions[iy] = y;
    // Get speed vectors
    rv = randIn(0.1, 1);
    vx = rv * cx * 0,1;
    vy = rv * sy * 1; // this two will give us velocities in all circular directions
	velocities[i] = vx;
    velocities[iy] = vy;
    // Get random other values
	speeds[ih] = randIn(1, 8);
	sizes[ih] = randIn(0.5, 6);
    hues[ih] = randIn(100, 140);
    lifeSpans[i] = 0;
	lifeSpans[iy] = randIn(50, 200);
}

function drawParticle(i) {
	let iy, ih, x, y, n, tx, ty, s, vx, vy, h, si, l, alpha, ttl, color;

	iy = i + 1;
	ih = 0.5 * i | 0;
	x = positions[i];
	y = positions[iy];
	n = simplex.noise3D(x * 0.1025, y * 0.0025, tick * 0.005) * TAU;
	vx = lerp(velocities[i], cos(n * noiseSteps), 0.05); // mutate velocities with noise
	vy = lerp(velocities[iy], sin(n * noiseSteps), 0.05);
	s = speeds[ih];
	tx = x + vx * s; 
	ty = y + vy * s; // update positions
	h = hues[ih];
	si = sizes[ih];
	l = lifeSpans[i];
	ttl = lifeSpans[iy];
    alpha = fadeInOut(l, ttl);
	color = `hsla(${h},100%,60%,${alpha})`;

	l++;
	
	ctx.a.save();
	ctx.a.lineWidth = alpha * si + 1;
	ctx.a.strokeStyle = color;
	ctx.a.beginPath();
	ctx.a.moveTo(x, y);
	ctx.a.lineTo(tx, ty);
	ctx.a.stroke();
	ctx.a.closePath();
	ctx.a.restore();

	positions[i] = tx;
	positions[iy] = ty;
	velocities[i] = vx;
	velocities[iy] = vy;
	lifeSpans[i] = l;

	if(checkIfOutOfBounds(x, y) || l > ttl){
        initParticle(i);
    }
}

function checkIfOutOfBounds(x, y) {
	return(
		x > canvas.a.width ||
		x < 0 ||
		y > canvas.a.height ||
		y < 0
	);
}

function createCanvas() {
	canvas = {
		a: document.createElement("canvas"),
		b: document.createElement("canvas")
	};
	canvas.b.style = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	`;
	document.body.appendChild(canvas.b);
	ctx = {
		a: canvas.a.getContext("2d"),
		b: canvas.b.getContext("2d")
	};
	resize();
}

function resize() {
	const { innerWidth, innerHeight } = window;
	
	canvas.a.width = canvas.b.width = innerWidth;
	canvas.a.height = canvas.b.height = innerHeight;
	center[0] = 0.5 * innerWidth;
	center[1] = 0.5 * innerHeight;
}

function draw() {
    tick++;
    // nie kumam po co to
	ctx.a.clearRect(0,0,canvas.a.width,canvas.a.height);
	// ctx.b.fillStyle = 'rgba(0,0,0,0.9)';
	ctx.b.fillRect(0,0,canvas.b.width,canvas.b.height);
	
	for (let i = 0; i < particleCount * 2; i += 2) {
		drawParticle(i);
	}
	
	ctx.b.save();
	ctx.b.filter = 'blur(8px)';
	ctx.b.globalCompositeOperation = 'lighten';
	ctx.b.drawImage(canvas.a, 0, 0);
	ctx.b.restore();
	
	ctx.b.save();
	ctx.b.globalCompositeOperation = 'lighter';
	ctx.b.drawImage(canvas.a, 0, 0);
	ctx.b.restore();
	
	window.requestAnimationFrame(draw);
}

window.addEventListener("load", setup);
window.addEventListener("resize", resize);