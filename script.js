class FlockParams {
    constructor() {
        this.maxForce = 0.12
        this.maxSpeed = 3.5
        this.perceptionRadius = 100
        this.alignAmp = 1.1
        this.cohesionAmp = 0.8
        this.separationAmp = 1.1
    }
}

let seed = Math.random()
let legendarySize = 0
let legendaryPerc = 0
let legendarySpeed = 0
let legendaryNumber = 0
let flockParams = new FlockParams()

/*==================
lotusLeaf
===================*/

const shadowColor = 'rgba(0,0,0,0.05)'

class lotusLeaf {
    constructor(x, y, offset, scale) {
        this.x = x
        this.y = y
        this.offset = offset
        this.scale = scale
        this.color = color(71, 184, 151)
    }

    drawShape(vertices, offset, color) {
        fill(color)
        beginShape()
            vertices.map(v => vertex(v.x + offset, v.y + offset))
        endShape()
    }

    show() {
        push()
            translate(this.x, this.y)
            noiseDetail(1, .8)
            let vertices = []

            for (let i = 0; i < TWO_PI; i += radians(1)) {
                let x = this.offset * cos(i) + this.offset
                let y = this.offset * sin(i) + this.offset
                let r = 180 + map(noise(x, y), 0, 1, -this.scale, this.scale)
                let x1 = r * cos(i)
                let y1 = r * sin(i)
                vertices.push({x: x1, y: y1})
            }

            noStroke()
            this.drawShape(vertices, 50, shadowColor)
            this.drawShape(vertices, 0, this.color)

            vertices.map((v, index) => {
                if ((index + 1) % 40 === 0) {
                    strokeWeight(6)
                    stroke(23,111,88,40)
                    line(v.x * .1, v.y * .19, v.x * .9, v.y * .86)
                }
            })
        pop()
    }
}

/*==================
Ripple
===================*/
class Ripple {
    constructor(x, y) {
        this.position = createVector(x, y)
        this.size = random(40, 140)
        this.lifespan = 400
        this.color = color(255, 255, 255)
        this.sizeStep = random(2, 3)
        this.lifeStep = random(2, 10)
    }

    drawShape(x, y, offset, size, color) {
        stroke(color)
        strokeWeight(0.8)
        noFill()
        circle(x + offset, y + offset, size)
    }

    show() {
        this.color.setAlpha(this.lifespan)
        this.drawShape(this.position.x, this.position.y, 0, this.size, this.color)
        this.drawShape(this.position.x, this.position.y, 50, this.size, color(shadowColor))
    }

    update() {
        this.size += this.sizeStep
        this.lifespan -= this.lifeStep
    }
}

/*==================
Koi
===================*/

const koiColors2 = ['#141414', //black
                    '#ffffff',
                    '#ffffff',
                    '#ffffff'] //white

class Koi {
    constructor(x, y, koiColor, koiColor2) {
        //color selection
        this.color = color(koiColor)
        this.color2 = color(koiColor2)
        this.offsetX = random(-100, 100)
        this.offsetY = random(-100, 100)
        this.position = createVector(x + this.offsetX, y + this.offsetY)
        this.velocity = p5.Vector.random2D()
        this.velocity.setMag(random(2, 10))
        this.acceleration = createVector()
        this.maxForce = flockParams.maxForce
        this.maxSpeed = flockParams.maxSpeed + legendarySpeed
        this.baseSize = int(random(15, 20)) + legendarySize
        this.bodyLength = this.baseSize * 2
        this.body = new Array(this.bodyLength).fill({...this.position})
        flockParams.perceptionRadius = legendaryPerc
    }

    calculateDesiredSteeringForce (kois, factorType) {
        let steering = createVector()
        let total = 0
        for (let other of kois) {
            let d = dist(
                this.position.x,
                this.position.y,
                other.position.x,
                other.position.y
            )
            if (d < flockParams.perceptionRadius && other != this) {
                switch (factorType) {
                    case 'align':
                        if (Math.random() < .01){
                            
                        } else {
                            steering.add(other.velocity)
                        }
                        break;
                    case 'cohesion':
                        steering.add(other.position)
                        break;
                    case 'separation':
                        let diff = p5.Vector.sub(this.position, other.position)
                        diff.div(d)
                        steering.add(diff)
                        break;
                    default:
                        break;
                }
                total++
            }
        }
        if (total > 0) {
            steering.div(total)
            if (factorType === 'cohesion') steering.sub(this.position)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    align = kois => this.calculateDesiredSteeringForce(kois, 'align')

    cohesion = kois => this.calculateDesiredSteeringForce(kois, 'cohesion')

    separation = kois => this.calculateDesiredSteeringForce(kois, 'separation')

    avoid(obstacle) {
        let steering = createVector()
        let d = dist(
            this.position.x,
            this.position.y,
            obstacle.x,
            obstacle.y
        )
        if (d < flockParams.perceptionRadius + 100) {
            let diff = p5.Vector.sub(this.position, obstacle)
            diff.div(d)
            steering.add(diff)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    edges() {
        if (this.position.x > width + 50) {
            this.position.x = -50
        } else if (this.position.x < -50) {
            this.position.x = width + 50
        }
        if (this.position.y > height + 50) {
            this.position.y = -50
        } else if (this.position.y < -50) {
            this.position.y = height + 50
        }
    }

    flock(kois) {
        this.acceleration.mult(0)
        let alignment = this.align(kois)
        let cohesion = this.cohesion(kois)
        let separation = this.separation(kois)

        let mouseObstacle = createVector(mouseX, mouseY)
        let avoid = this.avoid(mouseObstacle)

        alignment.mult(flockParams.alignAmp)
        cohesion.mult(flockParams.cohesionAmp)
        separation.mult(flockParams.separationAmp)
        
        this.acceleration.add(avoid)
        this.acceleration.add(separation)
        this.acceleration.add(alignment)
        this.acceleration.add(cohesion)

        this.acceleration.add(p5.Vector.random2D().mult(.05))
    }

    updateBody() {
        this.body.unshift({...this.position})
        this.body.pop()
    }

    show() {
        noStroke()
        this.body.forEach((b, index) => {
            let size
            if ( index < this.bodyLength / 6 ) {
                size = this.baseSize + index * 1.8
            } else {
                size = this.baseSize * 2 - index
            }
            this.color.setAlpha(this.bodyLength - index)
            fill(this.color)
            ellipse(b.x, b.y, size, size)
        })
    }

    showShadow() {
        noStroke()
        this.body.forEach((b, index) => {
            let size
            if ( index < this.bodyLength / 6 ) {
                size = this.baseSize + index * 1.8
            } else {
                size = this.baseSize * 1.8 - index
            }
            fill(200, 200, 200, 20)
            ellipse(b.x + 50, b.y + 50, size, size)
        })
    }
  
    showTail() {
      noStroke()
      this.body.forEach((b, index) => {
        let size
        if ( index < this.bodyLength / 6 ) {
          size = this.baseSize + index * 0.1
        } else {
          size = this.baseSize * 1.4 - index
        }
        fill(this.color2)
        this.color2.setAlpha(this.bodyLength + 30 - index)
        ellipse(b.x, b.y, size, size)
      })
    }
     
    showShadowTail() {
      noStroke()
      this.body.forEach((b, index) => {
        let size
        if ( index < this.bodyLength / 6 ) {
          size = this.baseSize + index * 0.1
        } else {
          size = this.baseSize * 1.4 - index
        }
        fill(200, 200, 200, 20)
        ellipse(b.x + 50, b.y + 50, size, size)
      })
    }
  
    update() {
        this.position.add(this.velocity)
        this.velocity.add(this.acceleration)
        this.velocity.limit(flockParams.maxSpeed)
        this.updateBody()
    }
}

/*==================
Sketch: setup, draw, etc.
===================*/

const flock = []
const ripples = []
const lotusLeaves = []
const koiNumber = 20

function setup() {
    createCanvas(windowWidth, windowHeight)

    if (seed < .001) {
        document.getElementById("prob").innerHTML = returnProb("Unknown");
        document.getElementById("prob").classList.add('unknown');
        legendaryPerc = 300;
        legendarySize = -4;
        new Array(koiNumber + legendaryNumber).fill(1).map(_ => flock.push(new Koi(100, 100, newColor(), newColor())))
    } else {
        const color = colorSelect1()
        const color2 = colorSelect2(color)
        new Array(koiNumber + legendaryNumber).fill(1).map(_ => flock.push(new Koi(100, 100, color, color2)))
    }

    lotusLeaves.push(new lotusLeaf(100, 100, .4, 100))
    lotusLeaves.push(new lotusLeaf(width - 100, height - 100, 1, 40))
}

function colorSelect1 () {
    if (seed < .0001) {               //0.002% Unknown
    }
    else if (seed < .002) {           //0.019% COSMIC
        document.getElementById("prob").innerHTML = returnProb("Cosmic");
        document.getElementById("percent").innerHTML = returnProb("0.019%");
        document.getElementById("prob").classList.add('cosmic');
        legendarySpeed = 8;
        legendaryPerc = 120;
        return '#FFC0CB'
    }
    else if (seed < .008) {           //0.6% MYTHIC
        document.getElementById("prob").innerHTML = returnProb("Mythic");
        document.getElementById("percent").innerHTML = returnProb("0.06%");
        document.getElementById("prob").classList.add('mythic');
        legendarySpeed = 5;
        legendaryPerc = 120;
        return '#a245ff'
    }
    else if (seed < .03) {      //2.2% LEGENDARY
        document.getElementById("prob").innerHTML = returnProb("Legendary");
        document.getElementById("percent").innerHTML = returnProb("2.2%");
        document.getElementById("prob").classList.add('legendary');
        legendaryPerc = 380;
        legendarySpeed = 3;
        legendaryAmp = 0.8;
        return '#fffff1'
    }
    else if (seed < .07) {       //4% DEMON
        document.getElementById("prob").innerHTML = returnProb("Epic");
        document.getElementById("percent").innerHTML = returnProb("4%");
        document.getElementById("prob").classList.add('epic');
        legendarySize = 1;
        legendaryPerc = 100;
        legendaryNumber = -5
        return '#141414'
    }
    else if (seed < .12) {      //5% SAPHIRE
        document.getElementById("prob").innerHTML = returnProb("Rare");
        document.getElementById("percent").innerHTML = returnProb("5%");
        document.getElementById("prob").classList.add('rare');
        legendaryPerc = 150;
        return '#fffff2'
    }
    else if (seed < .18) {      //6% Yellow
        document.getElementById("prob").innerHTML = returnProb("Uncommon");
        document.getElementById("percent").innerHTML = returnProb("6%");
        document.getElementById("prob").classList.add('uncommon');
        legendaryPerc = 100;
        return '#ffbf00'
    }
    else if (seed < .26) {      //8% Black base
        document.getElementById("prob").innerHTML = returnProb("Common");
        document.getElementById("percent").innerHTML = returnProb("82%");
        document.getElementById("prob").classList.add('common');
        legendaryPerc = 100;
        return '#141413'
    }
    else if (seed < .33) {       //7% White base
        document.getElementById("prob").innerHTML = returnProb("Common");
        document.getElementById("percent").innerHTML = returnProb("82%");
        document.getElementById("prob").classList.add('common');
        legendaryPerc = 100;
        return '#ffffff'
    }
    else if (seed < .9) {       //57% Mixed Common
        document.getElementById("prob").innerHTML = returnProb("Common");
        document.getElementById("percent").innerHTML = returnProb("82%");
        document.getElementById("prob").classList.add('common');
        legendaryPerc = 120;
        return '#f1541b'
    }
    else {                      //10% Pure common
        document.getElementById("prob").innerHTML = returnProb("Common");
        document.getElementById("percent").innerHTML = returnProb("82%");
        document.getElementById("prob").classList.add('common');
        legendaryPerc = 120;
        return '#ff5000'
    }
}

function colorSelect2 (color) {
    if (color === '#FFC0CB') { 
        return '#ef8aef'
    }
    else if (color === '#a245ff') { 
        return '#0aebff'
    }
    else if (color === '#fffff1') {        
        return '#ffbf00'
    }
    else if (color === '#141414') {             
        return '#ca040a'
    }
    else if (color === '#fffff2') {             
        return '#234edb'
    }
    else if (color === '#ffbf00') {             
        return '#ffbf00'
    }
    else if (color === '#141413') {
        return random(koiColors2)
    }
    else if (color === '#ffffff') {
        return random(koiColors2)
    } 
    else if (color === '#f1541b') {
        return random(koiColors2)
    } 
    else {
        return '#f1541b'
    }
}

const minL = 0.75;
const maxL = 0.90;
const interval = 3000;

function HSLtoRGB(h, s, l) {
  let r, g, b;
  
  const rd = (a) => {
    return Math.floor(Math.max(Math.min(a*256, 255), 0)); 
  };
  
  const hueToRGB = (m, n, o) => {
    if (o < 0) o += 1;
    if (o > 1) o -= 1;
    if (o < 1/6) return m + (n - m) * 6 * o;
    if (o < 1/2) return n;
    if (o < 2/3) return m + (n - m) * (2/3 - o) * 6;
    return m;
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  r = hueToRGB(p, q, h + 1/3);
  g = hueToRGB(p, q, h);
  b = hueToRGB(p, q, h - 1/3);

  return [rd(r), rd(g), rd(b)]
}

function RGBtoHex(r, g, b) {
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

function newColor() {
  const hBase = Math.random();
  const newH = Math.floor(hBase * 360);
  const newL = Math.floor(Math.random() * 16) + 75;
  
  const [ r, g, b ] = HSLtoRGB(hBase, 1, newL*.01);

  return RGBtoHex(r,g,b); // PRODUCT
}

function returnProb(prob) {
    return prob;
}

function draw() {
    background(230)
    // shadow
    flock.forEach(koi => {
        koi.showShadow()
        koi.showTail()
        koi.showShadowTail()
    })

    flock.forEach(koi => {
        koi.edges()
        koi.flock(flock)
        koi.update()
        koi.show()
    })

    if (frameCount % 30 === 0) ripples.push(new Ripple(random(width), random(height)))

    ripples.forEach((r, i) => {
        r.update()
        r.show()
        if (r.lifespan < 0 ) ripples.splice(i, 1)
    })
    lotusLeaves.forEach(leaf => leaf.show())
}

/*==================
Sketch: click to ripple
===================*/
function mouseClicked() {
    ripples.push(new Ripple(mouseX, mouseY))
}
function windowResized() {
  // this function executes everytime the window size changes
  // set the sketch width and height to the 5 pixels less than
  // windowWidth and windowHeight. This gets rid of the scroll bars.
  resizeCanvas(windowWidth, windowHeight);
  // set background to light-gray
  background(200);
}