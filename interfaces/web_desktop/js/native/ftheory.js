/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = window.friendUP || {};
friendUP.native = friendUP.native || {};

(function( ns, undefined )
{
	ns.FTheory = function( containerElement )
	{
		if ( !( this instanceof ns.FTheory ))
			return new ns.FTheory( containerElement );
		
		var self = this;
		self.scene = null;
		self.camera = null;
		self.renderer = null;
		self.container = containerElement;
		
		self.near = 12000;
		self.far = 1;
		self.particleCount = 300;
		self.speed = 10;
		
		self.animationId = null;
		self.init();
	}
	
	ns.FTheory.prototype.init = function()
	{
		var self = this;
		//console.log( 'native.ftheory.init' );
		self.bindEvents();
		self.setupScene();
		self.setupParticles();
		//self.loadLogo( logoReady );
		self.startRenderLoop();
		
		function logoReady() {
			self.startRenderLoop();
		}
	}
	
	ns.FTheory.prototype.bindEvents = function() {
		var self = this;
		window.onresize = resize;
		self.container.addEventListener( 'click', canvasClick, false );
		
		function resize( e ) {
			self.stopRenderLoop();
			if ( self.resizeTimeout ) {
				window.clearTimeout( self.resizeTimeout );
			}
			self.resizeTimeout = window.setTimeout( restartRenderLoop, 250 );
			self.resize();
			
			function restartRenderLoop() {
				self.resizeTimeout = null;
				self.startRenderLoop();
			}
		}
		
		function canvasClick( e ) {
			console.log( 'ftheory.js - canvasClick' );
			if ( !fTheory.animationId )
				fTheory.startRenderLoop();
			else
				fTheory.stopRenderLoop();
		}
	}
	
	ns.FTheory.prototype.resize = function() {
		var self = this;
		
		var width = self.container.clientWidth;
		var height = self.container.clientHeight;
		
		self.camera.aspect = width / height;
		self.camera.updateProjectionMatrix();
		self.renderer.setSize( width, height );
	}
	
	ns.FTheory.prototype.loadLogo = function( readyCallback ) {
		var self = this;
		var logoUrl = '/webclient/native/About/res/Logo.obj';
		var loader = new THREE.ObjectLoader();
		loader.load( logoUrl, loadBack );
		
		function loadBack( file ) {
			console.log( 'loadBack', file );
			self.file = file;
			readyCallback();
		}
	}
	
	ns.FTheory.prototype.setupScene = function()
	{
		var self = this;
		var fov = 100;
		var aspectRatio = self.container.clientWidth / self.container.clientHeight;
		var nearClip = 1;
		var farClip = 12000;
		self.scene = new THREE.Scene();
		self.camera = new THREE.PerspectiveCamera( fov, aspectRatio, nearClip, farClip );
		//self.camera.
		self.renderer = new THREE.WebGLRenderer(
		{
			antialias: true,
			alpha: true
		} );
		
		self.renderer.setSize( self.container.clientWidth, self.container.clientHeight );
		self.container.appendChild( self.renderer.domElement );
		
		self.camera.position.z = 12000;
		self.scene.add( self.camera );
		self.scene.fog = new THREE.Fog( 0xff22ff, 1, 10000 );
	}
	
	ns.FTheory.prototype.setupParticles = function()
	{
		var self = this;
		self.group = new THREE.Group();
		var material = new THREE.MeshBasicMaterial({
			
		});
		
		for ( var i = self.particleCount; i >= 0; i-- ) {
			create( i );
		}
		function create( index ) {
			var starGeo = new THREE.CircleGeometry( 10, 10 );
			var star = new THREE.Mesh( starGeo, material.clone() );
			self.randomPosition( star );
			star.position.z = index * ( self.near / self.particleCount );
			self.group.add( star );
		}
		
		
		self.scene.add( self.group );
	}
	
	ns.FTheory.prototype.randomPosition = function( star ) {
		star.position.x = ( Math.random() * 8000 ) -4000;
		star.position.y = ( Math.random() * 8000 ) -4000;
	}
	
	ns.FTheory.prototype.startRenderLoop = function()
	{
		var self = this;
		render();
		
		function render() {
			self.animationId = requestAnimationFrame( render );
			self.step();
		}
	}
	
	ns.FTheory.prototype.stopRenderLoop = function()
	{
		var self = this;
		//console.log( 'fTheory.stopRenderLoop()');
		window.cancelAnimationFrame( self.animationId );
		self.animationId = null;
	}
	
	ns.FTheory.prototype.step = function()
	{
		var self = this;
		self.updateParticles();
		self.renderer.render( self.scene, self.camera );
	}
	
	ns.FTheory.prototype.updateParticles = function()
	{
		var self = this;
		var clamp = self.near * self.near;
		
		self.group.children.forEach( update );
		function update( star, index ) {
			if ( star.position.z > self.near ) {
				star.position.z = self.far;
				self.randomPosition( star );
			}
			star.position.z += self.speed;
		}
	}
	
})( friendUP.native );

window.Application.run = fun;
function fun( fupConf )
{
	//console.log( 'About.app.fun', fupConf);
	var container = document.getElementById( 'FTheoryCanvasContainer' );
	//window.about = new friendUP.native.FCInfo();
	window.fTheory = new friendUP.native.FTheory( container );	
}
