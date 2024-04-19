// biar jd variable global
var GL;
class myObject{

     object_vertex = [];
    // ini bebas yang var tp GL hrs sama
     OBJECT_VERTEX = GL.createBuffer();
     object_faces = [];
     OBJECT_FACES= GL.createBuffer();
     // kasih anak
     child =[];
   

    shader_vertex_source;
    // vColor hrs sama atas dan bawah kalau ga ga jalan, Fragcolor buat panggil warnanya
    shader_fragment_source;

    // ini template diambil aja 
     compile_shader = function(source, type, typeString){
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if(!GL.getShaderParameter(shader, GL.COMPILE_STATUS)){
            alert("ERROR IN" + typeString + "SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };
     shader_vertex ;
     shader_fragment;

     SHADER_PROGRAM;
     _Pmatrix;
     _Vmatrix;
     _Mmatrix;
     _color;
     _position;
     MOVEMATRIX = LIBS.get_I4();
    constructor(object_vertex, object_faces,shader_vertex_source,shader_fragment_source){
        this.object_vertex = object_vertex;
        this.object_faces = object_faces;
        this.shader_vertex_source = shader_vertex_source;
        this.shader_fragment_source = shader_fragment_source;
       this.shader_vertex = this.compile_shader(this.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
       this.shader_fragment = this.compile_shader(this.shader_fragment_source,GL.FRAGMENT_SHADER, "FRAGMENT");
   
       this.SHADER_PROGRAM = GL.createProgram();
       GL.attachShader(this.SHADER_PROGRAM,this.shader_vertex);
       GL.attachShader(this.SHADER_PROGRAM,this.shader_fragment);
   
       GL.linkProgram(this.SHADER_PROGRAM);
   
       this._Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Pmatrix");
       this._Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Vmatrix");
       this. _Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Mmatrix");
   
       this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
       this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");
   
       GL.enableVertexAttribArray(this._color);
       GL.enableVertexAttribArray(this._position);
   
       GL.useProgram(this.SHADER_PROGRAM);
       this.initializeObject();
    }

    initializeObject(){
            // cara panggil ksh tau untuk menghandle tipe data tipenya float
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        // KSH TAU KOMPUTER DATANYA YANG MANA 
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.object_vertex), GL.STATIC_DRAW);
        // kasih tau komputer gambarnya urutannya gmn misal 0 1 2 , hrs berlawanan jarum jam untuk gambar

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER,this.OBJECT_FACES);
        // DIKSH TAU INFORMASI DATA YYG MAU DIHANDLE
        // DATA BUKAN FLOAT INTEGER KRN INDEX PASTI KYK 1 2 3
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.object_faces), GL.STATIC_DRAW);
    }
    setUniform4(PROJMATRIX,VIEWMATRIX){
        GL.useProgram(this.SHADER_PROGRAM); // ini bentukkan vlass untuk membuat objek ?
        GL.uniformMatrix4fv(this._Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(this._Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(this._Mmatrix, false, this.MOVEMATRIX);
    }

    draw(){
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER,this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position,3,GL.FLOAT,false,4*(3+3), 0);
        GL.vertexAttribPointer(this._color,3,GL.FLOAT,false,4*(3+3), 3*4);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.drawElements(GL.TRIANGLES,this.object_faces.length, GL.UNSIGNED_SHORT,0);

        for(var i =0;i <this.child.length;i++){
            this.child[i].draw();
        }

    }
    // buat anak pernakan
    addChild(child){
        this.child.push(child);
        // tiap kali rotate juga anaknya draw anaknya juga
    }

};

function Sphere(rad,sector,a,b,c, red,green,blue ){
    var object = [];
    var x, y, z, xy;                              // vertex position
    var nx, ny, nz
    var radius = rad;
    var lengthInv = 1.0 / radius;                 // vertex normal
    var s, t;                                     // vertex texCoord

    var sectorCount = 30;
    var stackCount = 30;
    var sectorStep = sector * Math.PI / sectorCount;
    var stackStep = Math.PI / stackCount;
    var sectorAngle, stackAngle;

for(var i = 0; i <= stackCount; ++i)
{
    stackAngle = Math.PI / 2 - i * stackStep;        // starting from pi/2 to -pi/2
    xy = radius * Math.cos(stackAngle);             // r * cos(u)
    z = a * radius * Math.sin(stackAngle);              // r * sin(u)

    // add (sectorCount+1) vertices per stack
    // first and last vertices have same position and normal, but different tex coords
    for(var j = 0; j <= sectorCount; ++j)
    {
        sectorAngle = j * sectorStep;           // starting from 0 to 2pi

        // vertex position (x, y, z)
        x = c * xy * Math.cos(sectorAngle);             // r * cos(u) * cos(v)
        y =  b * xy * Math.sin(sectorAngle);             // r * cos(u) * sin(v)
        object.push(x);
        object.push(y);
        object.push(z);
        object.push(red);
        object.push(green);
        object.push(blue);
    }
};
    
    var objectface = [];

    var k1, k2;
for(var i = 0; i < stackCount; ++i)
{
    k1 = i * (sectorCount + 1);     // beginning of current stack
    k2 = k1 + sectorCount + 1;      // beginning of next stack
// jika dibagi 2 maka akan dilakukan sectorcount/2
    for(var j = 0; j < sectorCount; ++j, ++k1, ++k2)
    {
        // 2 triangles per sector excluding first and last stacks
        // k1 => k2 => k1+1
        if(i != 0)
        {
            objectface.push(k1);
            objectface.push(k2);
            objectface.push(k1 + 1);
        }

        // k1+1 => k2 => k2+1
        if(i != (stackCount-1))
        {
            objectface.push(k1 + 1);
            objectface.push(k2);
            objectface.push(k2 + 1);
        }

        // store indices for lines
        // vertical lines for all stacks, k1 => k2
        // lineIndices.push_back(k1);
        // lineIndices.push_back(k2);
        // if(i != 0)  // horizontal lines except 1st stack, k1 => k+1
        // {
        //     triangle_faces.push(k1);
        //     triangle_faces.push(k1 + 1);
        // }
    }
};

return {object,objectface};
};


function ellipticparaloid(a,b,c,red,green,blue){
    var object = [];
    var i,j;
	i=0;
	for(var u=-Math.PI;u<=Math.PI;u+=Math.PI/180)
	{	j=0;
		for(var v=-Math.PI/2;v<Math.PI/2;v+=Math.PI/180)
		{	object.push(a * (v)* Math.cos(u));
			object.push(b * (v)* Math.sin(u));
			object.push(c* v * v);
            object.push(red);
            object.push(green);
            object.push(blue);
			j++;
		}
		i++;
	};
    var objectface = [];
    for (i = 0 ; i <= object.length ; i++){
        objectface.push(0);
        objectface.push(i+1);
        objectface.push(i);
    };
    return {object,objectface};

};

function kerucut (red,green,blue){
var circle_vertex = [];
   var jumlah = 360;
   for (var i = 0 ; i <= jumlah ; i++){
       circle_vertex.push(0.5 * Math.cos(i * Math.PI/180));
       circle_vertex.push(0.5 * Math.sin(i * Math.PI/180));
       circle_vertex.push(0);
       circle_vertex.push(0);
       circle_vertex.push(1);
       circle_vertex.push(1);
   };

   //Titik tengah
   circle_vertex.push(0);
   circle_vertex.push(0);
   circle_vertex.push(-1);
   circle_vertex.push(red);
   circle_vertex.push(green);
   circle_vertex.push(blue);


    var circle_faces = [];
    var jumlah2 = 360;
    //Buat Alas
    for (var i = 0 ; i <= jumlah2 ; i++){
        circle_faces.push(i);
        circle_faces.push(i + 1);
        circle_faces.push(0);
    };

    //Buat Sisinya
    for (var i = 0 ; i <= jumlah2 ; i++){
        circle_faces.push(i);
        circle_faces.push(i + 1);
        circle_faces.push(361);
    };
    return{circle_faces,circle_vertex};
};

function tabung(){
    var circle_vertex = [];
var jumlah = 360;
var colors = []; // Array buat kumpulin  random colors

for (var i = 0; i <= jumlah; i++) {
    circle_vertex.push(0.5 * Math.cos(i * Math.PI / 180));
    circle_vertex.push(0.5 * Math.sin(i * Math.PI / 180));
    circle_vertex.push(0);

    // mengenerate random color sekali setiap 60 vertice
    if (i % 60 == 0) {
        colors = [
            Math.random() * 255 / 255,
            Math.random() * 255 / 255,
            Math.random() * 255 / 255
        ];
    }

    // di dlm index 60 kalau ga sampe 0 ya belum ganti warna msh sama terus 
    circle_vertex.push(colors[0]);
    circle_vertex.push(colors[1]);
    circle_vertex.push(colors[2]);
}

// LINGKARAN BAWAH 
for (var i = 0; i <= jumlah; i++) {
    circle_vertex.push(0.5 * Math.cos(i * Math.PI / 180));
    circle_vertex.push(0.5 * Math.sin(i * Math.PI / 180));
    circle_vertex.push(-2);

    
    if (i % 60 == 0) {
        colors = [
            Math.random() * 255 / 255,
            Math.random() * 255 / 255,
            Math.random() * 255 / 255
        ];
    }

    circle_vertex.push(colors[0]);
    circle_vertex.push(colors[1]);
    circle_vertex.push(colors[2]);
}



var warna2 = [
    Math.random() * 255 / 255,
    Math.random() * 255 / 255,
    Math.random() * 255 / 255
];

// untuk titik ditengah atas 
circle_vertex.push(0);
circle_vertex.push(0);
circle_vertex.push(0);

circle_vertex.push(warna2[0]);
circle_vertex.push(warna2[1]);
circle_vertex.push(warna2[2]);

// untuk titik ditengah bawah
circle_vertex.push(0);
circle_vertex.push(0);
circle_vertex.push(-2);

circle_vertex.push(warna2[0]);
circle_vertex.push(warna2[1]);
circle_vertex.push(warna2[2]);


// faces
var circle_faces = [];
var jumlah2 = 360;
// LINGKARAN DIGAMBAR
for (var i = 0 ; i <= jumlah2 ; i++){
    circle_faces.push(i); 
    circle_faces.push(i+1);
    circle_faces.push(722);
    
};
console.log(circle_vertex.length);
// ALAS ATAS HUHUUHUHH
for (var i = 361 ; i <= 721 ; i++){
    circle_faces.push(i);
    circle_faces.push(i+1);
    circle_faces.push(723);
};
// LOOP 2 SEGITIGA 
for (var i = 0 ; i <= jumlah2 ; i++){
    circle_faces.push(i);
    circle_faces.push(i + 361);
    circle_faces.push(i+1);
    circle_faces.push(362+i);
    circle_faces.push(i + 361);
    circle_faces.push(i+1);
    
};


};

function main(){
    var CANVAS = document.getElementById("mycanvas");

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    // supaya nilainya mendekati nol , jd hrs kurang 1 , ini buat ngurangi dx dan dy
    var AMORIZATION = 0.95;

    var x_prev, y_prev;
    var drag = false;
    var THETA = 0, PHI = 0;
    // buat ksh perlambatan
    var dX =0, dY=0;

    var mouseDown = function(e) {
        drag = true;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
        return false;
    }

    var mouseUp = function(e) {
        drag = false;
    }

    var mouseMove = function(e) {
        if(!drag) return false;


        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX ; //rumus aslinya: dX * 2 * Math.PI, dibagi hanya untuk normalisasi saja
        PHI += dY ;

        //untuk mengupdate perpindahan mousenya
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
    }

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

   
    try {
        GL = CANVAS.getContext("webgl" , {antialias: false})

    }
    catch (error){
        alert("WebGL context cannot be initialized");
        return false;
    }

    // SHADERS
    // bs bikin 2 isi beda jumlah shaders terserah maunya kita, color yang handle fragment , hrs msk vertex, kita pindahin pake
    // variable khusus yaitu buat mindahin out, in masukkin. vColor position dll bole ganti krn nama variable.
    // kenapa vec4 itu 3 dimensi 
    var shader_vertex_source = `
    attribute vec3 position;
    attribute vec3 color; 

    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;

    varying vec3 vColor;
    void main(void){
        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        vColor = color;

    }`;
    // vColor hrs sama atas dan bawah kalau ga ga jalan, Fragcolor buat panggil warnanya
    var shader_fragment_source =`precision mediump float;
    varying vec3 vColor;
    void main(void){
        gl_FragColor = vec4(vColor, 1.0);
    }`;

    // BAGIAN KEPALA
    //  Sphere(rad,sector,a,b,c, red,green,blue )
    var kepalaAtas = Sphere(1.6, 1, 0.6, 0.86, 1, 1, 1, 1);
    var kepalaBawah = Sphere(0.8, 2,1.2,1,2,1,1,1);

    // BAGIAN MATA
    var mataKiri = Sphere(0.08,2,1.5,2,1,15/255,143/255,212/255);
    var mataKanan = Sphere(0.08,2,1.5,2,1,15/255,143/255,212/255);

    // BAGIAN MULUT 
    

    // BAGIAN BADAN
    var badan = Sphere(0.8,2,1,1,1.25,1,1,1);

    // BAGIAN TANGAN
    var tanganKiri = Sphere();
    var tanganKanan = Sphere();
    // BAGIAN TOPI

    var topi = kerucut(1,1,1);

    // BAGIAN SAYAP


    // BAGIAN SAPU 
    // tabung


    // BAGIAN EKOR


    

    var object1 = new myObject(kepalaBawah.object,kepalaBawah.objectface,shader_vertex_source,shader_fragment_source);
    var object2 = new myObject(kepalaAtas.object,kepalaAtas.objectface,shader_vertex_source,shader_fragment_source);
    var object3 = new myObject(mataKiri.object,mataKiri.objectface,shader_vertex_source,shader_fragment_source);
    var object4 = new myObject(mataKanan.object,mataKanan.objectface,shader_vertex_source,shader_fragment_source);
    var object5 = new myObject(badan.object,badan.objectface,shader_vertex_source,shader_fragment_source);
    var object6 = new myObject(topi.circle_vertex,topi.circle_faces,shader_vertex_source,shader_fragment_source);
    object1.addChild(object2);
    object1.addChild(object3);
    object1.addChild(object4);
    object1.addChild(object5);
    
    
    
    //MATRIX
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width/CANVAS.height,1, 100);

    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -7); //untuk mundurin camera dan camera tidak menabrak dengan objeknya

    GL.clearColor(0.0, 0.0, 0.0, 0.0); //R, G, B, Opacity

    //depth test berfungsi agar objek dapat dilihat secara menjorok karena apabila tidak menggunakan depth test objeknya dapat terlihat bolong atau transparan
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);

    GL.clearDepth(1.0);

    //DRAWING ---------------------------------------------------------------------------------------------
    var time_prev = 0;
    var animate = function(time) {
        if(time > 0) {
            //delta time adalah waktu yang dibutuhkan untuk pindah 1 frame ke frame lain
            var dt = (time - time_prev);
            // LIBS.rotateX(MOVEMATRIX, dt * 0.003);
            // LIBS.rotateY(MOVEMATRIX, dt * 0.002);
            // LIBS.rotateZ(MOVEMATRIX, dt * 0.001);
            // ketika mouse dilepas tp melambat jd gerak dikit
            if(!drag){
                dX *= AMORIZATION;
                dY *= AMORIZATION;
                THETA+= dX;
                PHI+=dY;

            }
            
            // harus urut z ,y,x agar muternya benar  
            // ini buat bs muterin objectnya kyk bumi mengelilingi matahari 


            // matrix posisi , matrix rotasi 


            // ini buat posisi
            object1.MOVEMATRIX = glMatrix.mat4.create();
            // glMatrix.mat4.(object1.MOVEMATRIX,object1.MOVEMATRIX,);
            glMatrix.mat4.translate(object1.MOVEMATRIX,object1.MOVEMATRIX, [0.0,0.0,0.0]);
            object2.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.translate(object2.MOVEMATRIX,object2.MOVEMATRIX, [0.0,0.0,0.0]);
            object3.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.translate(object3.MOVEMATRIX,object3.MOVEMATRIX, [-0.6,0.1,2.0]);
            object4.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.translate(object4.MOVEMATRIX,object4.MOVEMATRIX, [0.6,0.1,2.0]);
            object5.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.translate(object5.MOVEMATRIX,object5.MOVEMATRIX, [0.0,-1.0,0.0]);
            
           // glMatrix.mat4.fromRotationTranslationScaleOrigin(object1.MOVEMATRIX,);
            
          //  console.log(dt); --> untuk menampilkan waktunya di console lewat inspect
            time_prev = time;
        }

        GL.viewport(0,0,CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
        object1.setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.draw();

        // object2.setUniform4(PROJMATRIX,VIEWMATRIX);
        // object2.draw();

        //DRAWING
        //SEGITIGA yg pointer untuk tau posisi data dr yang -1,-1, dll gt.. 1 nya 4 bit (position 2 , color 3), trus startnya dr 0
        // untuk color sendiri itu 2 * 4 krn 1 float 4 jd krn ingin melewati 2 position itu jd dikali 2 kali 4 biar lewatin jd bs dpt color
     
       

        GL.flush();

        window.requestAnimationFrame(animate);

    };
    animate();



};
window.addEventListener('load', main);