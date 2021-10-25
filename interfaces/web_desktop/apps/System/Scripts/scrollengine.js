
// TODO: Hogne sin fade-in ...

scrollengine = {
	
	layout: false,
	
	callback: false,
	
	myArray: [],
	allNodes: [],
	
	// Visible elements
	
	elements: {
		pageAbove   : null,
		pageMiddle  : null,
		pageBelow   : null,
		wholeHeight : null
	},
	
	// TODO: Make sure to update current height based on div size auto ...
	
	config: {
		rowHeight  : 27,
		mustRedraw : true
	},
	
	// Some vars
	
	list: null,
	scrollTop: 0,
	viewHeight: 0,
	scrollHeight: 0,
	
	aTop: 0,
	dTop: 0,
	
	rowPosition: 0,
    rowCount: 0,
	
	dataStart: null,
	dataLimit: null,
	
	dataPrevStart: null,
	dataPrevLimit: null,
	
	counted: 0,
	
	total: 0,
	
	debug: false,
	
	ex: '',
	
	refreshTimeout: 0,
	
	selectedLine: null,
	
	// Set the layout function
	set: function( layout )
	{
		this.layout = layout;
	},
	
	// Initialize scroll engine
	init: function( list, data, total, callback )
	{
		let self = this;
		
		// Reset scroll engine
		this.reset();
		
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
			
			this.myArray = myArray ? myArray : [];
			
			this.list.addEventListener( 'scroll', function(){ scrollengine.refresh(); } );
			window.addEventListener( 'resize', function(){ scrollengine.refresh( true ); } );
			
			// Manage keystrokes
			window.addEventListener( 'keydown', function( e )
			{ 
				// Ignore input and textarea fields
				if( e.target && ( e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA' ) )
				{
					return;
				}
				switch( e.which )
				{
					// Page Up
					case 33:
						self.list.scrollTop -= self.list.offsetHeight;
						cancelBubble( e );
						break;
					// Page Down
					case 34:
						self.list.scrollTop += self.list.offsetHeight;
						cancelBubble( e );
						break;
					// Home	
					case 36:
						self.list.scrollTop = 0;
						cancelBubble( e );
						break;
					// End
					case 35:
						self.list.scrollTop = self.elements.wholeHeight.offsetHeight;
						cancelBubble( e );
						break;
					// Arrow Up
					case 38:
						self.list.scrollTop -= self.config.rowHeight;
						cancelBubble( e );
						break;
					// Arrow Down
					case 40:
						self.list.scrollTop += self.config.rowHeight;
						cancelBubble( e );
						break;
				}
			} );
			
			document.body.addEventListener( 'mouseover', function()
			{
				document.body.focus();
			} );
			
			if( data && total )
			{				
				this.distribute( data, 0, total );
			}
		}
	},
	// Check length of object
	length: function( object )
	{
		// Normal array
		if( typeof object.length !== "undefined" )
		{
			return object.length;
		}
		// This is an object of unknown length
		else
		{
			let i = 0;
			
			for ( let a in object )
			{
				if ( object[a] && typeof object[a] === 'object' && object[a] !== null )
				{
					i++;
				}
			}
			
			return i;
		}
	},
	
	unselectLine: function ()
	{
		if( this.selectedLine != null && this.allNodes[ this.selectedLine ] )
		{
			this.allNodes[ this.selectedLine ].className = this.allNodes[ this.selectedLine ].className.split( ' Selected' ).join( '' );
		}
		
		this.selectedLine = null;
	},
	
	createDiv: function ( id, target, line, classN, title )
	{
		
		let d = document.createElement( 'div' );
		if( id ) d.id = id;
		d.className = 'Absolute';
		d.style.width = '100%';
		if( classN ) d.className = classN;
		if( title ) d.title = title;
		if( line != null )
		{
			d.line = line;
			if( line == this.selectedLine )
			{
				// TODO: Check this based on what's in MyArray not lines ...
				//console.log( '['+line+'] ' + this.selectedLine );
				d.className = d.className.split( ' Selected' ).join( '' ) + ' Selected';
			}
		}
		target = ( target ? target : this.list );
		if( line != null && this.allNodes[ line ] )
		{
			// TODO: Look at this ...
			d.innerHTML = this.allNodes[ line ].innerHTML;
		}
		target.appendChild( d );
		return d;
	},
	
	emptyDiv: function( id )
	{
		if( id )
		{
			var ele = document.getElementById( id );
			
			if( ele && ele.innerHTML )
			{
				ele.innerHTML = '';
			}
		}
	},
	
	pageAbove: function()
	{
		
		let d = this.elements.pageMiddle;
		
		// TODO: Put this one offsetheight just like pageBelow ...
		
		// Page above
        let aa = document.createElement( 'div' );
        aa.id = 'pageAbove';
        this.counted = 0;
        let counted = 0;
        
        // Adjust database fetch calculator
        this.dataStart = this.rowPosition - this.rowCount;
        this.dataLimit = 0;
        if( this.dataStart < 0 )
        {
        	//this.dataLimit += this.dataStart; // decrement with adding  negative value
        	this.dataStart = 0;
        }
        
        let lines = [];
        let lastline = null;
        let startline = null;
        
        // Pageabove starts counting!
        for( let a = 0, b = this.rowPosition - this.rowCount, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
        {
            if( b >= this.length( this.myArray ) ) break;
            if( b < 0 ) continue;
            
            counted++;
            
            let row = this.createDiv( false, aa, b, 'RowElement Line ' + b, 'Line ' + b );
            
            lines.push( b );
            
            startline = ( startline != null ? startline : b );
            lastline = b;
        }
        
        this.counted = counted;
        this.dataLimit += counted;
        
        let t = this.dTop = ( Math.floor( this.scrollTop / this.config.rowHeight ) * this.config.rowHeight );
        let h = counted * this.config.rowHeight;
        aa.style.top = ( t - h ) + 'px';
        aa.style.height = h + 'px';
        
        this.list.replaceChild( aa, this.elements.pageAbove );
        
        this.elements.pageAbove = aa;
		
		return aa;
	},
	
	pageMiddle: function()
	{
		// Page middle
		this.dTop = ( Math.floor( this.scrollTop / this.config.rowHeight ) * this.config.rowHeight );
		let d = document.createElement( 'div' );
		d.id = 'pageMiddle';
		this.ex += this.rowPosition + ' pos ' + this.rowCount + ' count ' + "\r\n<br>";

		let counted = 0;
		
		let lines = [];
		let lastline = null;
		let startline = null;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, d, b, 'RowElement Line ' + b, 'Line ' + b );
			
			lines.push( b );
			
			startline = ( startline != null ? startline : b );
			lastline = b;
			
			counted++;
		}
		
		// Add to limit
		this.dataLimit += counted;
		this.counted += counted;
		
		console.log( '2: Will load ' + this.dataLimit + ' rows' );
		
		d.style.top = this.dTop + 'px';
		d.style.height = counted * this.config.rowHeight + 'px';
		
		this.list.replaceChild( d, this.elements.pageMiddle );
		this.elements.pageMiddle = d;

		// Add to rowPosition for next page
		this.rowPosition += this.rowCount;
		
		return d;
	},
	
	pageBelow: function()
	{		
		let d = this.elements.pageMiddle;
		
		// Page below
		let bb = document.createElement( 'div' );
		bb.id = 'pageBelow';
		//this.counted = 0;
		let counted = 0;
		
		let lines = [];
		let lastline = null;
		let startline = null;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, bb, b, 'RowElement Line ' + b, 'Line ' + b );
			
			lines.push( b );
			
			startline = ( startline != null ? startline : b );
			lastline = b;
			
			counted++;
		}
		
		// Add to limit
		this.dataLimit += counted;
		this.counted += counted;

		bb.style.top = d.offsetTop + d.offsetHeight + 'px';
		bb.style.height = counted * this.config.rowHeight + 'px';
		this.list.replaceChild( bb, this.elements.pageBelow );
		this.elements.pageBelow = bb;
		
		return bb;
	},
	
	// Distribute all data
	distribute: function( data, start, total, force )
	{
		if( total != null && this.total != total )
		{
			console.log( 'making new total ... ', { a: total, b: this.total } );
			
			// Data
			let myArray = [];
			
			if( total > 0 )
			{
				for( let a = 0; a < total; a++ )
				{
					if( this.myArray[ a ] )
					{
						myArray.push( this.myArray[ a ] );
					}
					else
					{
						myArray.push( {
							initialized: null,
						} );
					}
				}
			}
			
			this.total = total;
			
			this.myArray = myArray;
			
			// TODO: Look at this ...
			
			//this.dataPrevStart = start;
		}
		
		if( !this.elements.pageMiddle || force )
		{
			// TODO: look at why it updates the same twice if refresh is run ...
			this.refresh( force );
		}
		
		if( data )
		{
			// Update scroll list array with new data from JSON array
			for( let a = 0; a < this.length( data ); a++ )
			{
				if( this.myArray[ start + a ] )
				{
					let cacheImage = ( this.myArray[ start + a ].imageObj ? this.myArray[ start + a ].imageObj : false );
					this.myArray[ start + a ] = data[ a ];
					if( !cacheImage || !cacheImage.src )
					{
						this.myArray[ start + a ].imageObj = null;
					}
					else
					{
						this.myArray[ start + a ].imageObj = cacheImage;
					}
				}
			}
		}
		
		// All elements available
		let elements = [
			this.elements.pageAbove.childNodes,
			this.elements.pageMiddle.childNodes,
			this.elements.pageBelow.childNodes
		];
		
		// Aggregate list
		let allNodes = {}; let i = 0;
		for( let a = 0; a < elements.length; a++ )
		{
			for( let b = 0; b < elements[a].length; b++ )
			{
				if( elements[a][b].tagName.toLowerCase() == 'div' )
				{
					i++;
					
					if( elements[ a ][ b ].line != null )
					{
						allNodes[ elements[a][b].line ] = elements[ a ][ b ];
					}
					else
					{
						allNodes[ i ] = elements[ a ][ b ];
					}
				}
			}
		}
		
		this.allNodes = allNodes;
		
		//console.log( { start: start, allNodes: allNodes, myArray: this.myArray } );
		
		// Distribute
		if( this.layout )
		{
			let self = this;
			
			return this.layout( start, allNodes, this.myArray );
		}
		else
		{
			if( allNodes )
			{
				let self = this;
				let s = start;
				for( let a = 0; a < this.length( allNodes ); a++, s++ )
				{
					// Set content
					if( this.myArray[ s ] && allNodes[ s ] )
				    {
				    	
				    	let div = document.createElement( 'div' );
				    	div.className = 'Line ' + s;
				    	div.innerHTML = 'Line ' + s;
				    	
				    	let test = allNodes[ s ];
				    	if( test )
						{
							test = test.getElementsByTagName( 'div' );
							
							if( test.length )
							{
								allNodes[ s ].replaceChild( div, test[0] );
							}
							else
							{
								allNodes[ s ].innerHTML = '';
								allNodes[ s ].appendChild( div );
							}
							
							allNodes[ s ].title = 'Line ' + s;
							
							allNodes[ s ].onclick = function(  )
							{
								if( this.line != null && allNodes )
								{
									for( let i in allNodes )
									{
										if( allNodes[i] && allNodes[i].className && allNodes[i].className.indexOf( ' Selected' ) >= 0 )
										{
											allNodes[i].className = ( allNodes[i].className.split( ' Selected' ).join( '' ) );
										}
									}
									
									this.className = this.className.split( ' Selected' ).join( '' ) + ' Selected';
									self.selectedLine = this.line;
								}
							};
				    	}
				    	
				    }
				    else
				    {
				    	
				    	let test = allNodes[ s ];
				    	if( test )
				    	{
				    		allNodes[ s ].parentNode.removeChild( test );
				    	}
				    }
				}
			}
		}		
	},
	
	// Refresh function
	refresh: function( force )
	{
		// Store previous values for comparison
		this.dataPrevStart = this.dataStart;
		this.dataPrevLimit = this.dataLimit;
		
		this.counted = 0;
		
		// Make elements if they do not exist
		if( !this.elements.pageMiddle )
		{
			// Correct rowHeight based on css data
			this.createDiv( 'TestRow', false, false, 'RowElement' );
			
			if( document.getElementById( 'TestRow' ) && document.getElementById( 'TestRow' ).clientHeight != this.config.rowHeight )
			{
				this.config.rowHeight = document.getElementById( 'TestRow' ).clientHeight;
			}
			
			this.list.innerHTML = '';
			
		    this.elements.pageAbove   = this.createDiv( 'pageAbove' );
		    this.elements.pageMiddle  = this.createDiv( 'pageMiddle' );
		    this.elements.pageBelow   = this.createDiv( 'pageBelow' );
		    this.elements.wholeHeight = this.createDiv( 'wholeHeight' );
		}
		
		this.scrollTop    = this.list.scrollTop;
		this.viewHeight   = this.list.clientHeight; // window.innerHeight
		this.scrollHeight = ( this.config.rowHeight * this.length( this.myArray ) );
		
		// Some vars
		let list = this.list;
		
		let scrollTop    = this.scrollTop;
		let viewHeight   = this.viewHeight;
		let scrollHeight = this.scrollHeight;
		
		let pm = this.elements.pageMiddle;
		
		// Must redraw if pageMiddle is out of scroll view
		let redraw = false;
		
		// Page above is in full view!
		if( this.elements.pageAbove.offsetTop + this.elements.pageAbove.offsetHeight > scrollTop + scrollHeight )
		{
			redraw = true;
		}
		
		// [1] If pageMiddle is not visible within the scroll view then redraw
		if( scrollTop > pm.offsetTop + pm.offsetHeight )
		{
			console.log( 'Redrawing because pagemiddle is above' );
			redraw = true;
		}
		
		// [2] If pageMiddle is not visible within the scroll view then redraw
		if( scrollTop + viewHeight < pm.offsetTop )
		{
			console.log( 'Redrawing because pagemiddle is below' );
			redraw = true;
		}
				
		// [4] If scrollarea is resized or just argument force is passed as true then redraw
		if( force === true )
		{
			console.log( 'Forced redraw' );
			redraw = true;
		}
		
		if( redraw )
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
		
		let aaa = 0, ddd = 0, bbb = 0;
		let pageMarginMultiplier = 1.5;
		
		if( this.config.mustRedraw )
		{
		    this.config.mustRedraw = false;
		    
		    // Visible row position and row count based on scroll and view height
		    this.rowPosition = Math.floor( scrollTop / this.config.rowHeight );
		    this.rowCount    = Math.floor( ( viewHeight * pageMarginMultiplier ) / this.config.rowHeight ) + 1;
		    
		    // Set new datastart
		    this.prevDataStart = this.dataStart;
		    this.dataStart = this.rowPosition;
		    
		    //console.log( 'Prev data start is: ' + this.prevDataStart );
		    //console.log( 'New data start is: ' + this.dataStart );
		    
		    // Page above
		    aaa = this.pageAbove();
		    
		    // Page middle
		    ddd = this.pageMiddle();
			
		    // Page below
		    bbb = this.pageBelow();
		    
		    // When to load more data;
		    // We have new start data location, or we have increased limit (resize window)
		    if( 
		    	( this.dataPrevStart != null && this.dataStart != this.dataPrevStart ) || 
		    	( this.dataPrevLimit != null && this.dataLimit != this.dataPrevLimit ) )
		    {
		    	if( this.callback )
		    	{
		    		this.callback( 
		    		{ 
		    			start   : this.dataStart, 
		    			limit   : this.dataLimit, 
		    			myArray : this.myArray, 
		    			total   : this.total 
		    		} );
		    	}		    	
		    }
		}
		
		// If we counted the whole list, then
		if( this.counted >= this.length( this.myArray ) && ddd && bbb )
		{
	    	let hh = Math.max( ddd.offsetTop + ddd.offsetHeight, bbb.offsetTop + bbb.offsetHeight );
	    	this.elements.wholeHeight.style.height = hh + 'px';
		}
		// Else, use scrollHeight
		else
		{
		    this.elements.wholeHeight.style.height = scrollHeight + 'px';
		}
		
		this.list.focus();
	},
	
	reset: function ()
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
		
		this.selectedLine = null;
	},

	debugInfo: function( str )
	{
		
		if( this.list )
		{			
			// Add debug
			if( this.debug ) this.debug.innerHTML = str;
		}
		
		this.ex = '';
	}
	
};



