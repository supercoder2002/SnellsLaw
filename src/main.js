import * as THREE from 'three';

// THREE.js setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1;
camera.position.z = 16;

scene.background = new THREE.Color(0x444444);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
renderer.setAnimationLoop(animate);

const renderingDiv = document.getElementById("THREE");
renderingDiv.appendChild(renderer.domElement);

/* Snell's Law Setup*/

// refractive indices (user input)
var r1 = 1;
var r2 = 1;

// Snell's Law Calculations
const normalDir = new THREE.Vector3(0, 1, 0);
var entryDir = new THREE.Vector3(1, 0, 0).normalize(); // entry angle
var crossDir = new THREE.Vector3().crossVectors(entryDir.clone().negate(), normalDir).normalize(); // collision plane normal
var sideDir = new THREE.Vector3().crossVectors(crossDir, normalDir).normalize(); // dir perpendicular to normal on collision plane

/* Snell's Law: η * sin(θ) = η′ * sin(θ′) 
	η - refractive index entering
	η' - refractive index exiting
	θ - angle to normal entering
	θ′ - angle to normal exiting
*/

var dotVal = normalDir.dot(entryDir.clone().negate()); // calculates cosine of θ through dot product
var sinVal = (r1/r2) * Math.sqrt(1 - dotVal * dotVal); // calculates sine of θ′ by Snell's law and Pythagorean Identity
var cosVal = Math.sqrt(1 - sinVal * sinVal); // calculates cosine of θ′ using Pythagorean Identity

var parallelDir = normalDir.clone().negate().multiplyScalar(cosVal); // part of exit dir that is parallel to inverse normal
var perpendicularDir = sideDir.clone().multiplyScalar(sinVal); // part of exit dir that is perpendicular to inverse normal
var exitDir = new THREE.Vector3().addVectors(parallelDir, perpendicularDir); // exit dir

// Snell's Law Graphics

// arrows (vector representation)
const normalArrow = new THREE.ArrowHelper(normalDir, new THREE.Vector3(), 10, 0x222222);
scene.add(normalArrow);

const entryArrow = new THREE.ArrowHelper(entryDir, entryDir.clone().multiplyScalar(-10), 10, 0x00ff00);
scene.add(entryArrow);

const crossArrow = new THREE.ArrowHelper(crossDir, new THREE.Vector3(), 10, 0x222299);
scene.add(crossArrow);

const sideArrow = new THREE.ArrowHelper(sideDir, new THREE.Vector3(), 10, 0x992299);
scene.add(sideArrow);

const exitArrow = new THREE.ArrowHelper(exitDir, new THREE.Vector3(), 10, 0xffff00);
scene.add(exitArrow);

// normal plane
const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
geometry.rotateX(1.5707);
const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, wireframe: true});
const normalPlane = new THREE.Mesh(geometry, material);
scene.add(normalPlane);

// collision plane
const geometry2 = new THREE.PlaneGeometry(100, 100, 100, 100); 
const material2 = new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide, wireframe: true});
const collisionPlane = new THREE.Mesh(geometry2, material2);
collisionPlane.lookAt(new THREE.Vector3().crossVectors(normalDir, entryDir));
scene.add(collisionPlane);

const m1Geometry = new THREE.BoxGeometry(100, 50, 1);
const m1Material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x0000ff, transparent: true, opacity: 0.1});
const medium1 = new THREE.Mesh(m1Geometry, m1Material);
medium1.position.copy(new THREE.Vector3(0, 25, 0));
scene.add(medium1);

const m2Geometry = new THREE.BoxGeometry(100, 50, 1);
const m2Material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x00ff00, transparent: true, opacity: 0.1});
const medium2 = new THREE.Mesh(m2Geometry, m2Material);
medium2.position.copy(new THREE.Vector3(0, -25, 0));
scene.add(medium2);

/* Other variables (user input) */

var targetCamPos = camera.position.clone();

// rotation of entry dir
var entryRotation1 = 0;
var entryRotation2 = 0;

/* Main Loop */
function animate() {
	updateCheckBoxInput();
	renderer.render(scene, camera);
	camera.position.lerpVectors(camera.position, targetCamPos, 0.5);
}

/* User Input */

// sliders for entry dir and refractive indices
const dirSlider1 = document.getElementById("dirSlider1");
const dirSlider2 = document.getElementById("dirSlider2");
const iSlider1 = document.getElementById("iSlider1");
const iSlider2 = document.getElementById("iSlider2");
const collisionPlaneBox = document.getElementById("CPC");
const mediumVisualBox = document.getElementById("MVC");

// slider functions
dirSlider1.oninput = function() {
	entryRotation1 = this.value / 100 * Math.PI / 2;
	updateVisualCalc();
}

dirSlider2.oninput = function() {
	entryRotation2 = this.value / 100 * Math.PI * 2;
	updateVisualCalc();
}

iSlider1.oninput = function() {
	r1 = this.value;
	updateVisualCalc();
}

iSlider2.oninput = function() {
	r2 = this.value;
	updateVisualCalc();
}

function updateCheckBoxInput() {
	collisionPlane.visible = collisionPlaneBox.checked;
	medium1.visible = mediumVisualBox.checked;
	medium2.visible = mediumVisualBox.checked;
}


// updates visuals after user input
function updateVisualCalc() {
	entryDir.y = -Math.sin(entryRotation1);
	entryDir.x = Math.cos(entryRotation2) * Math.cos(entryRotation1);
	entryDir.z = Math.sin(entryRotation2) * Math.cos(entryRotation1);
	
	entryArrow.setDirection(entryDir);
	entryArrow.position.copy(entryDir.clone().multiplyScalar(-10));
	
	crossDir = new THREE.Vector3().crossVectors(entryDir.clone().negate(), normalDir).normalize();
	collisionPlane.lookAt(crossDir);
	crossDir.add(new THREE.Vector3(0, 25, 0));
	medium1.lookAt(crossDir);
	crossDir.add(new THREE.Vector3(0, -50, 0));
	medium2.lookAt(crossDir);

	dotVal = normalDir.dot(entryDir.clone().negate());
	sinVal = (r1/r2) * Math.sqrt(1 - dotVal * dotVal);
	
	// Total Internal Reflection (when sinVal is out of range, ray reflects)
	if (sinVal > 1) {
		exitDir = new THREE.Vector3().addVectors(normalDir.clone().multiplyScalar(2 * dotVal), entryDir);
	} else {
		cosVal = Math.sqrt(1 - sinVal * sinVal);
		crossDir.add(new THREE.Vector3(0, 25, 0));
		sideDir = new THREE.Vector3().crossVectors(crossDir, normalDir).normalize();
		parallelDir = normalDir.clone().negate().multiplyScalar(cosVal);
		perpendicularDir = sideDir.clone().multiplyScalar(sinVal);
		exitDir = new THREE.Vector3().addVectors(parallelDir, perpendicularDir);
	}
	exitArrow.setDirection(exitDir);
}

/* Camera control */

document.addEventListener("keydown", keypress);

function keypress() {
	let dir = new THREE.Vector3();
	camera.getWorldDirection(dir);
	if (event.key == "w") {
		targetCamPos.x += dir.x;
		targetCamPos.z += dir.z;
	} else if (event.key == "s") {
		targetCamPos.x -= dir.x;
		targetCamPos.z -= dir.z;
	} else if (event.key == "a") {
		targetCamPos.x += dir.z;
		targetCamPos.z += dir.x;
	} else if (event.key == "d") {
		targetCamPos.x -= dir.z;
		targetCamPos.z -= dir.x;
	} else if (event.key == "ArrowUp") {
		targetCamPos.y += 1.0;
	} else if (event.key == "ArrowDown") {
		targetCamPos.y -= 1.0;
	} else if (event.key == "ArrowLeft") {
		camera.rotation.y += 0.1;
	} else if (event.key == "ArrowRight") {
		camera.rotation.y -= 0.1;
	}
}
