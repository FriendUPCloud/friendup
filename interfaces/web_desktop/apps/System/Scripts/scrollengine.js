

console.log( 'scrollengine.js init ...' );

// TODO: get max count from server ...

// TODO: Hogne sin fade-in ...

scrollengine = {
	
	layout : false,
	
	callback : false,
	
	myArray : [],
	
	// Visible elements
	
	elements : {
		pageAbove   : null,
		pageMiddle  : null,
		pageBelow   : null,
		wholeHeight : null
	},
	
	// TODO: Make sure to update current height based on css data ...
	
	config : {
		rowHeight  : 27,
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
	
	dataStart   : null,
	dataLimit   : null,
	dataPrevStart : null,
	dataPrevLimit : null,
	
	counted : 0,
	
	total   : 0,
	
	debug : false,
	
	ex : '',
	
	refreshTimeout : 0,
	
	// TODO: Set custom layout from callback function ...
	
	set : function ( layout )
	{
		this.layout = layout;
	},
	
	init : function ( list, data, total, callback )
	{
		let self = this;
		
		this.reset();
		
		console.log( 'INIT RUN !!!' );
		
		if( list )
		{
			this.list = list;
			
			if( callback )
			{
				this.callback = callback;
			}
			
			// Data
			let myArray = [];
			
			if( data )
			{
				if( !total )
				{
					total = this.length( data );
				}
			}
			else
			{
				if( !total )
				{
					total = 1000;
				}
			}
			
			if( total > 0 )
			{
				for( let a = 0; a < total; a++ )
				{
					myArray.push( {
						initialized: null,
					} );
				}
			}
			
			this.total = total;
			
			this.myArray = ( myArray ? myArray : [] );
			
			this.list.addEventListener( 'scroll', function(  ){ scrollengine.refresh(  ); } );
			window.addEventListener( 'resize', function(  ){ scrollengine.refresh( true ); } );
			
			window.addEventListener( 'keydown', function( e )
			{ 
				
				//console.log( e.which, e.target ); 
				
				switch( e.which )
				{
					case 33:
						self.list.scrollTop -= self.list.offsetHeight;
						break;
					case 34:
						self.list.scrollTop += self.list.offsetHeight;
						break;
					case 36:
						self.list.scrollTop = 0;
						break;
					case 35:
						self.list.scrollTop = self.elements.wholeHeight.offsetHeight;
						break;
					case 38:
						self.list.scrollTop -= self.config.rowHeight;
						break;
					case 40:
						self.list.scrollTop += self.config.rowHeight;
						break;
				}
			} );
			
			document.body.addEventListener( 'mouseover', function()
			{
				window.focus();
				document.body.focus();
			} );
					
			this.refresh();
			
			if( data && total )
			{
				this.distribute( data, 0, total );
			}
			
		}
	},
	
	length : function ( myArray )
	{
		if( typeof myArray.length !== "undefined" )
		{
			return myArray.length;
		}
		else
		{
			let i = 0;
			
			for ( let a in myArray )
			{
				if( myArray[a] && myArray[a].ID )
				{
					i++;
				}
			}
			
			return i;
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
        let aa = document.createElement( 'div' );
        aa.id = 'pageAbove';
        this.counted = 0;
        
        // Adjust database fetch calculator
        this.dataStart = this.rowPosition - this.rowCount;
        this.dataLimit = this.rowCount;
        if( this.dataStart < 0 )
        {
        	this.dataLimit += this.dataStart; // decrement with adding  negative value
        	this.dataStart = 0;
        }
        
        // Pageabove starts counting!
        for( let a = 0, b = this.rowPosition - this.rowCount, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
        {
            if( b >= this.length( this.myArray ) ) break;
            this.counted = a;
            if( b < 0 ) continue;
            let row = this.createDiv( false, aa, 'RowElement' );
            row.style.top = c + 'px';
            row.style.background = 'grey';
			row.style.borderBottom = '1px solid black';
            //row.innerHTML = 'Line ' + b;
        }
        console.log( '[1] pageAbove', { counted: this.counted, dataStart: this.dataStart, dataLimit: this.dataLimit } );
        //aa.style.position = 'absolute';
        //aa.style.width = '100%';
        aa.style.top = this.aTop + 'px';
        aa.style.height = ( this.counted + 1 ) * this.config.rowHeight + 'px';
        this.list.replaceChild( aa, this.elements.pageAbove );
        this.elements.pageAbove = aa;
		
		return aa;
		
	},
	
	pageMiddle : function (  )
	{
		// Page middle
		this.dTop = Math.floor( this.scrollTop / this.config.rowHeight ) * this.config.rowHeight;
		let d = document.createElement( 'div' );
		d.id = 'pageMiddle';
		this.ex += this.rowPosition + ' pos ' + this.rowCount + ' count ' + "\r\n<br>";
		this.counted = 0;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, d, 'RowElement' );
			row.style.top = c + 'px';
            //row.innerHTML = 'Line ' + b;
			
			this.counted = a;
		}
		
		// Add to limit
		this.dataLimit += this.counted;
		console.log( '[2] pageMiddle', { counted: this.counted, dataStart: this.dataStart, dataLimit: this.dataLimit } );
		
		//d.style.position = 'absolute';
		//d.style.width = '100%';
		d.style.top = this.dTop + 'px';
		d.style.height = ( this.counted + 1 ) * this.config.rowHeight + 'px';
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
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, bb, 'RowElement' );
			row.style.top = c + 'px';
			row.style.background = 'green';
			row.style.borderBottom = '1px solid black';
            //row.innerHTML = 'Line ' + b;
			
			this.counted = a;
		}
		
		// Add to limit
		this.dataLimit += this.counted;
		console.log( '[3] pageBelow', { counted: this.counted, dataStart: this.dataStart, dataLimit: this.dataLimit } );
		
		//bb.style.position = 'absolute';
		//bb.style.width = '100%';
		bb.style.top = d.offsetTop + d.offsetHeight + 'px';
		bb.style.height = ( this.counted ) * this.config.rowHeight + 'px';
		this.list.replaceChild( bb, this.elements.pageBelow );
		this.elements.pageBelow = bb;
		
		return bb;
		
	},
	
	distribute: function( data, start, total )
	{
		// TODO: Update myArray if the limit has changed ...
		
		//console.log( 'this.myArray.length = ' + this.myArray.length );
		
		// Update scroll list array with new data from JSON array
		for( let a = 0; a < this.length( data ); a++ )
		{
			let cacheImage = this.myArray[ start + a ].imageObj;
			this.myArray[ start + a ] = data[ a ];
			if( !cacheImage || !cacheImage.src )
			{
				this.myArray[ start + a ].imageObj = null;
				//console.log( 'We have no cache image!' );
			}
			else
			{
				this.myArray[ start + a ].imageObj = cacheImage;
			}
		}
		
		// All elements available
		let elements = [
			this.elements.pageAbove.childNodes,
			this.elements.pageMiddle.childNodes,
			this.elements.pageBelow.childNodes
		];
		
		// Aggregate list
		let allNodes = [];
		for( let a = 0; a < elements.length; a++ )
		{
			for( let b = 0; b < elements[a].length; b++ )
			{
				if( elements[a][b].tagName.toLowerCase() == 'div' )
				{
					allNodes.push( elements[a][b] );
				}
			}
		}
		
		// Distribute
		if( this.layout )
		{
			return this.layout( start, allNodes, this.myArray );
		}
		else
		{
			let s = start;
			for( let a = 0; a < allNodes.length; a++, s++ )
			{
				// Set content
				if( this.myArray[ s ] )
		        {
		        	
		        	let div = document.createElement( 'div' );
		        	div.className = 'Line ' + s;
		        	div.innerHTML = 'Line ' + s;
		        	
		        	let test = allNodes[ a ].getElementsByTagName( 'div' );
		        	if( test.length )
		        	{
		        		allNodes[ a ].replaceChild( div, test[0] );
		        	}
		        	else
		        	{
		        		allNodes[ a ].innerHTML = '';
		        		allNodes[ a ].appendChild( div );
		        	}
		        	
		        	allNodes[ a ].title = 'Line ' + s;
		        	
		        }
			}
		}
				
	},
	
	// Refresh funksjon
	refresh : function ( force )
	{
		
		// Store previous values for comparison
		this.dataPrevStart = this.dataStart;
		this.dataPrevLimit = this.dataLimit;
		
		// Reset database fetch calculator
		this.dataStart = 0;
        this.dataLimit = 0;
		
		this.counted = 0;
		
		this.scrollTop    = this.list.scrollTop;
		this.viewHeight   = this.list.clientHeight/*window.innerHeight*/;
		this.scrollHeight = ( this.config.rowHeight * this.length( this.myArray ) );
		
		// Make elements if they do not exist
		if( !this.elements.pageAbove )
		{
			this.list.innerHTML = '';
			
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
		
		console.log( 'pm.offsetTop ' + pm.offsetTop );
		console.log( 'pm.offsetHeight ' + pm.offsetHeight );
		
		console.log( scrollTop+' > '+(pm.offsetTop + pm.offsetHeight)+(scrollTop > pm.offsetTop + pm.offsetHeight?' [TRUE]':' [FALSE]')+' || '+scrollTop+' < '+viewHeight+(scrollTop < viewHeight?' [TRUE]':' [FALSE]')+' || '+(scrollTop + viewHeight)+' < '+pm.offsetTop+(scrollTop + viewHeight < pm.offsetTop?' [TRUE]':' [FALSE]')+' || '+force );
		
		// Must redraw if pageMiddle is out of scroll view
		if( scrollTop > pm.offsetTop + pm.offsetHeight || scrollTop < viewHeight || scrollTop + viewHeight < pm.offsetTop || force === true )
		{
		    this.ex += 'Must redraw ' + "\r\n<br>";
		    this.config.mustRedraw = true;
		}
		else
		{
		    this.ex += ( pm.offsetTop + pm.offsetHeight ) + ' bottom vs scrollTop ' + scrollTop + "\r\n<br>";
		}
		
		// What's left to scroll after pages
		let leftToScroll = scrollHeight;
		
		if( this.config.mustRedraw )
		{
		    // TODO: Get latest database rows into myArray
		    
		    // TODO: Init callback ...
		    
		    this.config.mustRedraw = false;
		    
		    this.rowPosition = Math.floor( scrollTop / this.config.rowHeight );
		    this.rowCount    = Math.floor( viewHeight / this.config.rowHeight ) + 1;
		    
		    // Page above
		    if( scrollTop > viewHeight )
		    {
		    	let aa = this.pageAbove();
		    }
		    
		    // Page middle
		    let d = this.pageMiddle();
		    
		    // Page below
		    let bb = this.pageBelow();
		    
		    console.log( '[4] refresh', { counted: this.counted, dataStart: this.dataStart, dataLimit: this.dataLimit, dataPrevStart: this.dataPrevStart, dataPrevLimit: this.dataPrevLimit } );
		    
		    if( this.dataPrevStart != this.dataStart || this.dataPrevLimit != this.dataLimit )
		    {
		    	// Fetch new data
		    	// Distribute data rows from pageAbove, Middle, Below
		    	
		    	// TODO: return correct data to fetch next ... start and limit data ...
		    	
		    	// TODO: scrollTop minus means start in minus ...
		    	// TODO: scrollTop pluss means start in pluss ...
		    	
		    	
		    	
		    	console.log( 
		    	{ 
		    		start        : ( this.rowCount >= this.rowPosition ? this.dataStart : ( this.dataStart + this.dataLimit ) ), 
		    		limit        : ( ( this.rowCount >= this.rowPosition ? this.dataStart : ( this.dataStart + this.dataLimit ) ) + this.rowCount ), 
		    		prevstart    : this.dataPrevStart, 
		    		prevlimit    : this.dataPrevLimit, 
		    		rowPosition  : this.rowPosition, 
		    		rowCount     : this.rowCount, 
		    		leftToScroll : leftToScroll, 
		    		scrollTop    : scrollTop, 
		    		viewHeight   : viewHeight, 
		    		scrollHeight : scrollHeight 
		    	} );
		    	
		    	//this.setToPageAbove( this.myArray );
		    	//this.setToPageMiddle( this.myArray );
		    	//this.setToPageBellow( this.myArray );
		    	
		    	if( this.callback )
		    	{
		    		this.callback( 
		    		{ 
		    			start   : ( this.rowCount >= this.rowPosition ? this.dataStart : ( this.dataStart + this.dataLimit ) ), 
		    			limit   : ( ( this.rowCount >= this.rowPosition ? this.dataStart : ( this.dataStart + this.dataLimit ) ) + this.rowCount ), 
		    			myArray : this.myArray, 
		    			total   : this.total 
		    		} );
		    	}
		    }
		}
		
		// If we counted the whole list, then
		if( this.counted >= this.length( this.myArray ) )
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
		if( this.debug ) this.debugInfo( scrollTop + ' scroll ' + "\r\n<br>" + viewHeight + ' height ' + "\r\n<br>" + this.ex );
		
		this.list.focus();
		
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
			rowHeight  : 27,
			mustRedraw : true
		}
		
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
		
		if( this.list )
		{			
			// Add debug
			if( this.debug ) this.debug.innerHTML = str;
		}
		
		this.ex = '';
		
	}
	
};


