

console.log( 'scrollengine.js init ...' );



scrollengine = {
	
	myArray : [],
	
	// Visible elements
	
	elements : {
		pageAbove   : null,
		pageMiddle  : null,
		pageBelow   : null,
		wholeHeight : null
	},
	
	config : {
		rowHeight  : 35,
		mustRedraw : true
	},
	
	// Some vars
	
	list         : null,
	scrollTop    : 0,
	viewHeight   : 0,
	scrollHeight : 0,
	
	aTop : 0,
	dTop : 0,
	
	rowPosition : 0,
    rowCount    : 0,
	
	counted : 0,
	
	debug : true,
	
	ex : '',
	
	init : function ( list, myArray )
	{
		this.reset();
		
		if( list )
		{
			this.myArray = ( myArray ? myArray : [] );
			
			this.list = list;
			
			this.list.addEventListener( 'scroll', function(  ){ scrollengine.refresh(  ); } );
			window.addEventListener( 'resize', function(  ){ scrollengine.refresh( true ); } );
			
			this.refresh();
		}
	},
	
	createDiv : function ( id, target, classN )
	{
		
		let d = document.createElement( 'div' );
		if( id ) d.id = id;
		d.className = 'Absolute';
		d.style.width = '100%';
		if( classN ) d.className = classN;
		target = ( target ? target : this.list );
		target.appendChild( d );
		return d;
		
	},
	
	pageAbove : function (  )
	{
		
		// Page above
		this.aTop = Math.floor( ( this.scrollTop - this.viewHeight ) / this.config.rowHeight ) * this.config.rowHeight;
		//console.log( 'this.aTop ' + this.aTop );
        let aa = document.createElement( 'div' );
        aa.id = 'pageAbove';
        this.counted = 0;
        
        for( let a = 0, b = this.rowPosition - this.rowCount, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
        {
            if( b >= this.myArray.length ) break;
            this.counted = a;
            if( b < 0 ) continue;
            let row = this.createDiv( false, aa, 'RowElement' );
            row.style.top = c + 'px';
            row.innerHTML = 'Line ' + b;
        }
        
        //aa.style.position = 'relative';
        //aa.style.position = 'absolute';
        //aa.style.width = '100%';
        //console.log( 'aa.style.top = '+this.aTop+'px' );
        aa.style.top = this.aTop + 'px';
        aa.style.height = this.counted * this.config.rowHeight + 'px';
        this.list.replaceChild( aa, this.elements.pageAbove );
        this.elements.pageAbove = aa;
		
		return aa;
		
	},
	
	pageMiddle : function (  )
	{
		
		// Page middle
		this.dTop = Math.floor( this.scrollTop / this.config.rowHeight ) * this.config.rowHeight;
		//console.log( 'this.dTop ' + this.dTop );
		let d = document.createElement( 'div' );
		d.id = 'pageMiddle';
		this.ex += this.rowPosition + ' pos ' + this.rowCount + ' count';
		this.counted = 0;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.myArray.length ) break;
			let row = this.createDiv( false, d, 'RowElement' );
			row.style.top = c + 'px';
			row.innerHTML = 'Line ' + b;
			this.counted = a;
		}
		
		//d.style.position = 'relative';
		//d.style.position = 'absolute';
		//d.style.width = '100%';
		//console.log( 'd.style.top = '+this.dTop+'px' );
		d.style.top = this.dTop + 'px';
		d.style.height = this.counted * this.config.rowHeight + 'px';
		this.list.replaceChild( d, this.elements.pageMiddle );
		this.elements.pageMiddle = d;
		
		// Add to rowPosition for next page
		this.rowPosition += this.rowCount;
		
		return d;
		
	},
	
	pageBelow : function (  )
	{
		
		let d = this.elements.pageMiddle;
		
		// Page below
		let bb = document.createElement( 'div' );
		bb.id = 'pageBelow';
		this.counted = 0;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.myArray.length ) break;
			let row = this.createDiv( false, bb, 'RowElement' );
			row.style.top = c + 'px';
			row.style.background = 'green';
			row.innerHTML = 'Line ' + b;
			this.counted = a;
		}
		
		//bb.style.position = 'relative';
		//bb.style.position = 'absolute';
		//bb.style.width = '100%';
		//console.log( 'bb.style.top = '+this.dTop+' + '+d.offsetHeight + 'px' );
		bb.style.top = this.dTop + d.offsetHeight + 'px';
		bb.style.height = this.counted * this.config.rowHeight + 'px';
		this.list.replaceChild( bb, this.elements.pageBelow );
		this.elements.pageBelow = bb;
		
		return bb;
		
	},
	
	// Refresh funksjon
	refresh : function ( force )
	{
		
		//console.log( this.list );
		
		this.scrollTop    = this.list.scrollTop;
		this.viewHeight   = window.innerHeight;
		this.scrollHeight = ( this.config.rowHeight * this.myArray.length );
		
		// Make elements if they do not exist
		if( !this.elements.pageAbove )
		{
		    this.elements.pageAbove   = this.createDiv( 'pageAbove' );
		    this.elements.pageMiddle  = this.createDiv( 'pageMiddle' );
		    this.elements.pageBelow   = this.createDiv( 'pageBelow' );
		    this.elements.wholeHeight = this.createDiv( 'wholeHeight' );
		}
		
		// Some vars
		let list = this.list;
		
		let scrollTop    = this.scrollTop;
		let viewHeight   = this.viewHeight;
		let scrollHeight = this.scrollHeight;
		
		let pm = this.elements.pageMiddle;
		
		//this.ex += Math.random();
		
		// Must redraw if pageMiddle is out of scroll view
		if( scrollTop > pm.offsetTop + pm.offsetHeight || scrollTop + viewHeight < pm.offsetTop || force === true )
		{
		    this.ex += ' Must redraw';
		    this.config.mustRedraw = true;
		}
		else
		{
		    this.ex += '|' + ( pm.offsetTop + pm.offsetHeight ) + ' bottom vs ' + scrollTop + '|';
		}
		
		// What's left to scroll after pages
		let leftToScroll = scrollHeight;
		let counted = this.counted;
		
		if( this.config.mustRedraw )
		{
		    // TODO: Get latest database rows into myArray
		    
		    // TODO: Init callback ...
		    
		    this.config.mustRedraw = false;
		    
		    this.rowPosition = Math.floor( scrollTop / this.config.rowHeight );
		    this.rowCount    = Math.floor( viewHeight / this.config.rowHeight + 1 );
		    
		    // Page above
		    if( scrollTop > 0 )
		    {
		    	let aa = this.pageAbove();
		    }
		    
		    // Page middle
		    let d = this.pageMiddle();
		    
		    // Page below
		    let bb = this.pageBelow();
		}
		
		// If we counted the whole list, then
		if( counted >= this.myArray.length )
		{
		    let hh = Math.max( d.offsetTop + d.offsetHeight, bb.offsetTop + bb.offsetHeight );
		    this.elements.wholeHeight.style.height = hh + 'px';
		}
		// Else, use scrollHeight
		else
		{
		    this.elements.wholeHeight.style.height = scrollHeight + 'px';
		}
		
		// Add debug
		this.debugInfo( scrollTop + ' scroll ' + viewHeight + ' height' + this.ex );
		
	},
	
	reset : function (  )
	{
		
		this.elements = {
			pageAbove   : null,
			pageMiddle  : null,
			pageBelow   : null,
			wholeHeight : null
		},
		
		this.config = {
			rowHeight  : 35,
			mustRedraw : true
		},
		
		// Some vars
		
		this.list         = null,
		this.scrollTop    = 0,
		this.viewHeight   = 0,
		this.scrollHeight = 0,
		
		this.aTop = 0,
		this.dTop = 0,
		
		this.rowPosition = 0;
		this.rowCount    = 0;
		
		this.counted = 0;
		
		this.ex = '';
		
	},
	
	debugInfo : function( str )
	{
		
		// Add debug
		if( ge( 'Debug' ) ) ge( 'Debug' ).innerHTML = str;
		
		this.ex = '';
		
	}
	
};



