
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

var orbWidth = document.querySelector('.intro-overlay').offsetWidth;
console.log(orbWidth);

// if(!mobile) {
  // orbWidth *= window.devicePixelRatio;
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
    radius: mobile ? orbWidth + 50 : orbWidth - 150,
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
    radius: mobile ? orbWidth + 50 : orbWidth - 120,
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
      this.renderer.setSize( window.innerWidth, window.innerHeight, false );
      this.composer.setSize( window.innerWidth, window.innerHeight, false );
      
      this.camera.aspect = window.innerWidth / window.innerHeight;
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

// For sticky nav
setTimeout(() => {
  var marketingSection1 = document.querySelector('.marketing-section-1');
  var marketingSection1Overlay = marketingSection1.querySelector('.marketing-section-1-overlay');
  var marketingSection2 = document.querySelector('.marketing-section-2');
  var marketingSection2Overlay = marketingSection2.querySelector('.marketing-section-2-overlay');
  var marketingSection3 = document.querySelector('.marketing-section-3');
  // var marketingSection1Corners = document.querySelector('.marketing-section-1-corners');

  var fadeOutText2 = document.querySelector('.fadeout-text-2');
  var fadeOutImage2 = document.querySelector('.fadeout-image-2');

  // Use BG overlay only on desktop screens, otherwise use normal BG
  if(window.innerWidth >= 768) {
    if(window.innerHeight > 700) {
      marketingSection1Overlay.style.height = `${window.innerHeight - 187}px`;
      marketingSection2Overlay.style.height = `${window.innerHeight - 90}px`;
    }
    else {
      marketingSection1Overlay.style.height = `${window.innerHeight - 157}px`;
      marketingSection2Overlay.style.display = 'none';
    }
  }
  else {
    marketingSection1Overlay.style.height = `${window.innerHeight - 5}px`;
    marketingSection2Overlay.style.display = 'none';
  }
  
  // For rounded corners
  if(document.querySelector('.pin-spacer')) {
    document.querySelector('.pin-spacer').style.zIndex = 2;
  }

  var bgPosition = 0;
  var scrollPosition = 0;

  // For sticky nav
  var pageTop = document.getElementById('content-holder').offsetTop;
  var headerEl = document.querySelector('.sticky-nav');

  window.onscroll = function() {
    var y = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    if (y > pageTop) {
      headerEl.classList.add('is-sticky');

      if(window.innerWidth >= 1169) {
        marketingSection1Overlay.classList.add('is-scrolled');
        marketingSection1Overlay.style.height = `${window.innerHeight - 35}px`;
        marketingSection1Overlay.style.top = '0';
      }
      else {
        marketingSection1Overlay.classList.remove('is-scrolled');
        marketingSection1Overlay.style.height = `${window.innerHeight - 5}px`;
      }
    }
    else {
      headerEl.classList.remove('is-sticky');
      marketingSection1Overlay.classList.remove('is-scrolled');

      if(window.innerWidth >= 1169) {
        marketingSection1Overlay.style.height = `${window.innerHeight - 117}px`;
        marketingSection1Overlay.style.top = '155px';
      }
      else {
        marketingSection1Overlay.style.height = `${window.innerHeight - 5}px`;
      }
    }

    if ((window.innerHeight + window.scrollY) >= marketingSection1.offsetHeight + 150) {
      marketingSection1.classList.add('hidden-overlay');
      marketingSection1Overlay.style.display = 'none';
      // marketingSection1Corners.style.display = 'block';

      if ((window.innerHeight + window.scrollY) >= marketingSection1.offsetHeight + 800) {
        // marketingSection1Corners.style.display = 'none';
      }
    }
    else {
      marketingSection1.classList.remove('hidden-overlay');
      marketingSection1Overlay.style.display = 'block';
      // marketingSection1Corners.style.display = 'none';
    }

    if ((window.innerHeight + window.scrollY) >= marketingSection2.getBoundingClientRect().top + document.documentElement.scrollTop + 150) {
      marketingSection2.classList.remove('hidden-overlay');
      marketingSection2Overlay.style.display = 'block';
    }
    if ((window.innerHeight + window.scrollY) >= marketingSection3.getBoundingClientRect().top + document.documentElement.scrollTop + 150) {
      marketingSection2.classList.add('hidden-overlay');
      // marketingSection2Overlay.style.display = 'none';
    }

    if(document.querySelector('.section-pin')) {
      if(marketingSection2.closest('.section-pin').style.position == 'fixed') {
        if ((document.body.getBoundingClientRect()).top > scrollPosition) {
            // upscroll code
            if(bgPosition > 0) {
              bgPosition-= 1;
            }
        }
        else {
            // downscroll code
            if(bgPosition < 100) {
              bgPosition+= 1;
            }
        }
        marketingSection2Overlay.style.backgroundPosition = `50% ${bgPosition}%`;
        scrollPosition = (document.body.getBoundingClientRect()).top;
      }
    }

    var fadeOutText2Opacity = window.getComputedStyle(fadeOutText2, null).getPropertyValue('opacity');

    if(window.innerWidth >= 768) {
      if(fadeOutText2Opacity >= .3) {
        fadeOutImage2.classList.add('is-shown');
      }
      else {
        fadeOutImage2.classList.remove('is-shown');
      }
    }
    else {
      if(checkVisible(fadeOutImage2)) {
        fadeOutImage2.classList.add('is-shown');
      }
      else {
        fadeOutImage2.classList.remove('is-shown');
      }
    }
  };

  if(window.innerWidth < 768 && window.innerHeight < 750) {
    var pinkBGrows = document.querySelectorAll('.marketing-section--pink .row:not(:first-child)');

    for (var i = 0; i < pinkBGrows.length; i++) {
      pinkBGrows[i].style.transform = 'translateY(-90px)';
    }
  }
}, 500);

function checkVisible(elm) {
  var rect = elm.getBoundingClientRect();
  var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

// For smooth scroll
setTimeout(() => {
  document.querySelector('.hero-image a').addEventListener('click', (e) => {
    e.preventDefault();
    var href = e.currentTarget.getAttribute('href');
    var offsetTop = document.querySelector(href).offsetTop;

    scroll({
      top: offsetTop,
      behavior: 'smooth'
    });
  });
}, 10);

