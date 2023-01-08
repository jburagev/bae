"use strict";

var mobile = window.innerWidth <= 543;

// Canvas properties and configuration
var mousePosition = { x: 0.5, y: 0.5 };
var circlesPosition = { x: 0, y: 0, rotation: 0, ease: true };

var canvasProps = {
  fpsInterval: 1000 / 30,
  now: null,
  then: null,
  elapsed: null,
  stop: false
};

var orbWidth = document.querySelector('.intro-overlay').offsetWidth + 0;
console.log(document.querySelector('.hero-section').offsetHeight);


// if(!mobile) {  // orbWidth *= window.devicePixelRatio;
// }

// console.log(orbWidth);

var canvasObjects = [
  {
    offsetX: -230,
    offsetY: -80,
    scaleX: 1,
    scaleY: 0.8,
    distance: 50,
    radius: mobile ? orbWidth + 50 : orbWidth,
    colorStart: 'rgb(255, 154, 38)',
  },
  {
    offsetX: 300,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    distance: 100,
    radius: mobile ? orbWidth + 50 : orbWidth,
    colorStart: 'rgb(251, 255, 38)',
  },
  {
    offsetX: -150,
    offsetY: 350,
    scaleX: 1,
    scaleY: 0.8,
    distance: 50,
    radius: mobile ? orbWidth + 50 : orbWidth - 100,
    colorStart: 'rgb(255, 0, 168)',
  },
  {
    offsetX: -30,
    offsetY: -30,
    scaleX: 1,
    scaleY: 1,
    distance: 20,
    radius: mobile ? orbWidth + 50 : orbWidth - 100,
    colorStart: 'rgb(255, 0, 45)',
    colorStop: 'rgb(255, 0, 45)',
    delayed: true
  },
  {
    offsetX: 50,
    offsetY: 0,
    scaleX: 1,
    scaleY: 0.9,
    distance: 50,
    radius: mobile ? orbWidth + 50 : orbWidth - 100,
    colorStart: 'rgb(255, 0, 45)',
    colorStop: 'rgb(255, 92, 0)',
    delayed: true
  },
  {
    offsetX: 50,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    distance: 20,
    radius: mobile ? orbWidth + 50 : orbWidth - 100,
    colorStart: 'rgb(255, 0, 45)',
    colorStop: 'rgb(255, 92, 0)',
    delayed: true
  },
  {
    offsetX: -50,
    offsetY: -50,
    scaleX: 1,
    scaleY: 1,
    distance: 20,
    radius: mobile ? orbWidth + 50 : orbWidth - 200,
    colorStart: 'rgb(255, 92, 0)',
    colorStop: 'rgb(255, 0, 45)',
    delayed: true
  }
];

var EasingFunctions = {
  /*
    t = time
    b = beginning value
    c = change in value
    d = duration
  */
  easeOutQuad: function (t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  }
}

class Orb {
  initialize() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);
    //this.camera = new THREE.PerspectiveCamera(75, document.querySelector('.hero-section').offsetWidth / document.querySelector('.hero-section').offsetWidth, .1, 1000);
    this.camera.position.z = 1000;
    this.scene.add(this.camera);

    this.circles = new THREE.Group();

    canvasObjects.forEach(config => {
      var increment = mobile ? 1.35 : 1.25;

      var mat = new THREE.ShaderMaterial({
        uniforms: {
          color1: {
            value:  new THREE.Color(config.colorStart)
          },
          color2: {
            value:  new THREE.Color(config.colorStop)
          }
        },
        transparent: true,
        blending: THREE.NormalBlending,
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, ${increment});
          }
        `,
        fragmentShader: `
          #define PI 3.1415926
          #define TWO_PI PI*2.
            
          uniform vec3 color1;
          uniform vec3 color2;
        
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv * 2. - 1.;
            
            float r = TWO_PI/4.;
            float d = cos(floor(.5)*r)*length(uv);
            
            gl_FragColor = vec4(mix(color1, color2, d), ${increment});
          }
        `,
      });

      var circle = new THREE.CircleGeometry(config.radius, 100);
      var mesh = new THREE.Mesh(circle, mat);
      mesh.position.set(config.offsetX, -(config.offsetY), 0);
      mesh.scale.set(0, 0, 1);

      Object.assign(mesh, config);
      
      this.circles.add(mesh);
    });

    this.circles.rotation.z = -1.5;
    this.scene.add(this.circles);

    this.renderer = new THREE.WebGLRenderer({alpha: true});
    document.getElementById('intro-canvas').appendChild(this.renderer.domElement);

    this.blur();
    this.pulsate();

    canvasProps.then = Date.now();
    this.animateCanvas();
  }

  blur() {
    this.composer = new POSTPROCESSING.EffectComposer(this.renderer);
    this.renderPass = new POSTPROCESSING.RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    var blurPass = new POSTPROCESSING.BlurPass({
      kernelSize: POSTPROCESSING.KernelSize.HUGE
    });
    this.composer.addPass(blurPass);
  }

  pulsate() {
    anime({
      targets: document.getElementById('intro-canvas').querySelector('canvas'),
      scale: mobile ? '*=1.03' : '*=1.07',
      easing: 'easeInOutSine',
      duration: 1500,
      loop: true,
      direction: 'alternate'
    });
  }

  animateCanvas() {
    var canvas = document.querySelector('.intro-canvas');
    var scaleSize = !mobile ? 1 : .7;
    var scaleSpeed = !mobile ? 8 : 20;
    var scaleSpeedDelayed = !mobile ? 14 : 30;

    if (!canvas) {
      canvasProps.stop = true;
      return;
    }

    window.addEventListener('resize', this.resize, false);
    this.resize();

    this.renderer.clear();
    this.composer.render();
    requestAnimationFrame(() => this.animateCanvas());

    canvasProps.now = Date.now();
    canvasProps.elapsed = canvasProps.now - canvasProps.then;

    if (canvasProps.elapsed > canvasProps.fpsInterval) {

      for (var i = 0; i < this.circles.children.length; i++) {
        var sphere = this.circles.children[i];

        var scaleSizeX = sphere.scaleX;
        var scaleSizeY = sphere.scaleY;

        if(sphere.delayed === true) {
          if(sphere.scale.x < scaleSizeX) {
            sphere.scale.x = EasingFunctions.easeOutQuad(.3, sphere.scale.x, 1 - sphere.scale.x, 10);
          }
          if(sphere.scale.y < scaleSizeY) {
            sphere.scale.y = EasingFunctions.easeOutQuad(.3, sphere.scale.y, 1 - sphere.scale.y, 10);
          }
        }
        else {
          if(sphere.scale.x < scaleSizeX) {
            sphere.scale.x = EasingFunctions.easeOutQuad(.3, sphere.scale.x, 1 - sphere.scale.x, scaleSpeed);
          }
          if(sphere.scale.y < scaleSizeY) {
            sphere.scale.y = EasingFunctions.easeOutQuad(.3, sphere.scale.y, 1 - sphere.scale.y, scaleSpeed);
          }
        }

        var directionX = (mousePosition.x - 0.5) * -2;
        var distanceX = sphere.distance * directionX;
        var calibrationX = canvas.offsetWidth * (1 - sphere.scaleX) / 2;

        var directionY = (mousePosition.y - 0.5) * -2;
        var distanceY = sphere.distance * directionY;
        var calibrationY = canvas.offsetHeight * (1 - sphere.scaleY) / 2;

        sphere.position.x = Math.round(sphere.offsetX + calibrationX + distanceX);
        sphere.position.y = Math.round(-(sphere.offsetY) + calibrationY + distanceY);
      }

      // if(!mobile) {
      //   circlesPosition.y = 150 * (window.devicePixelRatio < 1 ? .6 : -.2 );
      // }

      if(circlesPosition.ease === true) {
        this.circles.position.x = EasingFunctions.easeOutQuad(.3, this.circles.position.x, circlesPosition.x - this.circles.position.x, 6);
        this.circles.position.y = EasingFunctions.easeOutQuad(.3, this.circles.position.y, circlesPosition.y - this.circles.position.y, 6);
        this.circles.rotation.z = EasingFunctions.easeOutQuad(.3, this.circles.rotation.z, circlesPosition.rotation - this.circles.rotation.z, 30);
      }
      else {
        this.circles.position.x = circlesPosition.x;
        this.circles.position.y = circlesPosition.y;
        this.circles.rotation.z = circlesPosition.rotation;
      }

      canvasProps.then = canvasProps.now - (canvasProps.elapsed % canvasProps.fpsInterval);
    }
  }

  resize() {
    if(this.renderer && this.composer && this.camera) {
      // this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.setSize( window.innerWidth, document.querySelector('.hero-section').offsetHeight, false );
      this.composer.setSize( window.innerWidth, document.querySelector('.hero-section').offsetHeight, false );
      
      this.camera.aspect = window.innerWidth / document.querySelector('.hero-section').offsetHeight;
      this.camera.updateProjectionMatrix();
    }
  }
}

var orb = new Orb();
orb.initialize();

// Event listeners
(async function() {
  if(!mobile) {
    window.addEventListener('mousemove', event => {
      mousePosition.x = event.clientX / window.innerWidth;
      mousePosition.y = event.clientY / window.innerHeight;
    }, false);
  }
  else {
    window.addEventListener('mousemove', event => {
      mousePosition.x = event.clientX / window.innerWidth;
      mousePosition.y = event.clientY / window.innerHeight;
    }, false);

    window.addEventListener('touchmove', event => {
      mousePosition.x = event.touches[0].clientX / window.innerWidth;
      mousePosition.y = event.touches[0].clientY / window.innerHeight;
    }, false);
  }
})();
