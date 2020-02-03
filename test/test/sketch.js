let video;
let poseNet;
let poses = [];
let Vwidth = 640;
let Vheight = 480;
let LeyeX = 0;
let LeyeY = 0;
let LeyeArrayX = [];
let LeyeArrayY = [];
let ReyeX = 0;
let ReyeY = 0;
let ReyeArrayX = [];
let ReyeArrayY = [];
let noseX = 0;
let noseY = 0;
let noseArrayX = [];
let noseArrayY = [];
let score = 0.2;
let vScale = 16;
let eyeDist = 0;
let minColDist = 30;
let maxColDist = 900;
let minEyeDist = 30;
let maxEyeDist = 60;
let thred = 0;


function setup() {
	//imageMode(CENTER);
	createCanvas(windowWidth, windowHeight);
	pixelDensity(1);
	//video used for live video processing
	video = createCapture(VIDEO);
	//videoAI used for poseNet
	videoAI = createCapture(VIDEO);
	//vScale to scale down the original video, improve performance
	video.size(width / vScale, height / vScale);
	videoAI.size(Vwidth / 2, Vheight / 2);
	// Create a new poseNet method with a single detection
	poseNet = ml5.poseNet(videoAI, modelReady);
	// This sets up an event that fills the global variable "poses"
	// with an array every time new poses are detected
	poseNet.on('pose', function (results) {
		poses = results;
	});
	// Hide the video element, and just show the canvas
	video.hide();
	videoAI.hide();
}

function modelReady() {
	select('#status').html('Model Loaded');
}

function draw() {
	background(255);
	drawKeypoints();
	//get distance between left eye and right eye, the distance is bigger if the user is closer to the camera
	eyeDist = dist(LeyeX, LeyeY, ReyeX, ReyeY);
	thred = map(eyeDist, minEyeDist, maxEyeDist, maxColDist, minColDist);
	thred = constrain(thred, 30, 900);

	//live video processing: find edges.
	if (video.loadedmetadata) {
		video.loadPixels();
		loadPixels();
		let edgeAmout = 1;
		for (let x = edgeAmout; x < video.width - edgeAmout; x++) {
			for (let y = edgeAmout; y < video.height - edgeAmout; y++) {
				let index = (x + y * video.width) * 4
				let thisR = video.pixels[index];
				let thisG = video.pixels[index + 1];
				let thisB = video.pixels[index + 2];
				let colorDifference = 0;
				for (let blurX = x - edgeAmout; blurX < x + edgeAmout; blurX++) {
					for (let blurY = y - edgeAmout; blurY < y + edgeAmout; blurY++) {
						let blurIndex = (blurX + blurY * video.width) * 4;
						let R = video.pixels[blurIndex];
						let G = video.pixels[blurIndex + 1];
						let B = video.pixels[blurIndex + 2];
						colorDifference += dist(R, G, B, thisR, thisG, thisB);
						//console.log(colorDifference);

					}
				}
				//using colordifference between every pixel and it's neighbor, to find edge and give different color
				//to improve the performance, using size of ellpise to present edges in a lower resolution.
				if (colorDifference > thred) {
					fill(0);
					noStroke();
					let w = map(eyeDist, minEyeDist, maxEyeDist, 0, vScale);
					ellipse(x * vScale, y * vScale, w, w)

				} else {
					fill(255);
					noStroke();
					let w = map(eyeDist, minEyeDist, maxEyeDist, 0, vScale);
					ellipse(x * vScale, y * vScale, w, w)

				}
			}
		}

	}

}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
	// Loop through all the poses detected
	for (let i = 0; i < poses.length; i++) {
		// For each pose detected, loop through all the keypoints
		let pose = poses[0].pose;
		//I need left eye, right eye, nose position
		let Leye = pose.keypoints[1];
		let Reye = pose.keypoints[2];
		let nose = pose.keypoints[0];
		// Only process point which the pose probability is bigger than 0.2(score)
		if (Leye.score > score) {
			fill(0),
				noStroke();
			//push left eye x,y value into an 8 unit array, to smooth out the value.
			LeyeArrayX.push(Leye.position.x);
			if (LeyeArrayX.length > 8) {
				LeyeArrayX.shift();
				LeyeX = average(LeyeArrayX);
			}
			LeyeArrayY.push(Leye.position.y);
			if (LeyeArrayY.length > 8) {
				LeyeArrayY.shift();
				LeyeY = average(LeyeArrayY);
			}
		}
		//push right eye x,y value into an 8 unit array, to smooth out the value.
		if (Reye.score > score) {
			fill(255, 0, 0),
				noStroke();
			ReyeArrayX.push(Reye.position.x);
			if (ReyeArrayX.length > 8) {
				ReyeArrayX.shift();
				ReyeX = average(ReyeArrayX);
			}
			ReyeArrayY.push(Reye.position.y);
			if (ReyeArrayY.length > 8) {
				ReyeArrayY.shift();
				ReyeY = average(ReyeArrayY);
			}

		}
		//push nose x,y value into an 8 unit array, to smooth out the value.
		if (nose.score > score) {
			fill(255, 0, 0),
				noStroke();
			noseArrayX.push(nose.position.x);
			if (noseArrayX.length > 8) {
				noseArrayX.shift();
				noseX = average(noseArrayX);
			}
			noseArrayY.push(nose.position.y);
			if (noseArrayY.length > 8) {
				noseArrayY.shift();
				noseY = average(noseArrayY);
			}

		}
	}
}


//function of get average value of a moving array
function average(array) {
	let total = 0;
	for (let i = 0; i < array.length; i++) {
		total += array[i];
	}
	return total / array.length;
}


