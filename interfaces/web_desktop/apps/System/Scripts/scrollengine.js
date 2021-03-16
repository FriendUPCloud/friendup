
// TODO: Hogne sin fade-in ...

scrollengine = {
	
	layout : false,
	
	callback : false,
	
	myArray  : [],
	allNodes : [],
	
	// Visible elements
	
	elements : {
		pageAbove   : null,
		pageMiddle  : null,
		pageBelow   : null,
		wholeHeight : null
	},
	
	// TODO: Make sure to update current height based on div size auto ...
	
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
	
	selectedLine : null,
	
	set : function ( layout )
	{
		this.layout = layout;
	},
	
	init : function ( list, data, total, callback )
	{
		let self = this;
		
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
			
			this.myArray = ( myArray ? myArray : [] );
			
			this.list.addEventListener( 'scroll', function(  ){ scrollengine.refresh(  ); } );
			window.addEventListener( 'resize', function(  ){ scrollengine.refresh( true ); } );
			
			window.addEventListener( 'keydown', function( e )
			{ 
				
				//console.log( e.which, e.target ); 
				
				switch( e.which )
				{
					// Page Up
					case 33:
						self.list.scrollTop -= self.list.offsetHeight;
						break;
					// Page Down
					case 34:
						self.list.scrollTop += self.list.offsetHeight;
						break;
					// Home	
					case 36:
						self.list.scrollTop = 0;
						break;
					// End
					case 35:
						self.list.scrollTop = self.elements.wholeHeight.offsetHeight;
						break;
					// Arrow Up
					case 38:
						self.list.scrollTop -= self.config.rowHeight;
						break;
					// Arrow Down
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
			
			if( data && total )
			{				
				this.distribute( data, 0, total );
			}
			
		}
	},
	
	length : function ( object )
	{
		if( typeof object.length !== "undefined" )
		{
			return object.length;
		}
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
	
	unselectLine : function ()
	{
		if( this.selectedLine != null && this.allNodes[ this.selectedLine ] )
		{
			this.allNodes[ this.selectedLine ].className = this.allNodes[ this.selectedLine ].className.split( ' Selected' ).join( '' );
		}
		
		this.selectedLine = null;
	},
	
	createDiv : function ( id, target, line, classN, title )
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
				console.log( '['+line+'] ' + this.selectedLine );
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
	
	emptyDiv : function ( id )
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
	
	pageAbove : function (  )
	{
		
		let d = this.elements.pageMiddle;
		
		// TODO: Put this one offsetheight just like pageBelow ...
		
		// Page above
		this.aTop = ( Math.floor( ( this.scrollTop - this.viewHeight ) / this.config.rowHeight ) * this.config.rowHeight ) - this.config.rowHeight;
        let aa = document.createElement( 'div' );
        aa.id = 'pageAbove';
        this.counted = 0;
        let counted = 0;
        
        // Adjust database fetch calculator
        this.dataStart = this.rowPosition - this.rowCount;
        this.dataLimit = this.rowCount;
        if( this.dataStart < 0 )
        {
        	this.dataLimit += this.dataStart; // decrement with adding  negative value
        	this.dataStart = 0;
        }
        
        let lines = [];
        let lastline = null;
        let startline = null;
        
        // Pageabove starts counting!
        for( let a = 0, b = this.rowPosition - this.rowCount, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
        {
            if( b >= this.length( this.myArray ) ) break;
            counted = a;
            if( b < 0 ) continue;
            let row = this.createDiv( false, aa, b, 'RowElement Line ' + b, 'Line ' + b );
            //row.style.top = c + 'px';
            //row.style.background = 'yellow';
            
            lines.push( b );
            
            startline = ( startline != null ? startline : b );
            lastline = b;
            
        }
        
        this.counted = (counted?(counted+1):0);
        
        //aa.style.position = 'absolute';
        //aa.style.width = '100%';
        aa.style.top = this.aTop + 'px';
        aa.style.height = ( counted + 1 ) * this.config.rowHeight + 'px';
        this.list.replaceChild( aa, this.elements.pageAbove );
        this.elements.pageAbove = aa;
		
		console.log( '[1] pageAbove top: ' + aa.style.top, { 
			startline   : (startline?startline:0), 
			lastline    : (lastline?lastline:0), 
			lines       : lines, 
			rowPosition : (this.rowPosition-this.rowCount),
			counted     : (counted?(counted+1):0), 
			dataStart   : this.dataStart, 
			dataLimit   : this.dataLimit,
			divstyle    : aa.style.cssText
		} );
		
		return aa;
		
	},
	
	pageMiddle : function (  )
	{
		// Page middle
		this.dTop = ( Math.floor( this.scrollTop / this.config.rowHeight ) * this.config.rowHeight );
		let d = document.createElement( 'div' );
		d.id = 'pageMiddle';
		this.ex += this.rowPosition + ' pos ' + this.rowCount + ' count ' + "\r\n<br>";
		//this.counted = 0;
		let counted = 0;
		
		let lines = [];
		let lastline = null;
		let startline = null;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, d, b, 'RowElement Line ' + b, 'Line ' + b );
			//row.style.top = c + 'px';
			//row.style.background = 'grey';
			
			lines.push( b );
			
			startline = ( startline != null ? startline : b );
			lastline = b;
			
			//this.counted = a;
			counted = a;
		}
		
		// Add to limit
		//this.dataLimit += this.counted;
		this.dataLimit += (counted?(counted+1):0);
		
		this.counted += (counted?(counted+1):0);
		
		//d.style.position = 'absolute';
		//d.style.width = '100%';
		d.style.top = this.dTop + 'px';
		d.style.height = ( counted + 1 ) * this.config.rowHeight + 'px';
		
		this.list.replaceChild( d, this.elements.pageMiddle );
		this.elements.pageMiddle = d;
		
		console.log( '[2] pageMiddle top: ' + d.style.top, { 
			startline     : (startline?startline:0), 
			lastline      : (lastline?lastline:0), 
			lines         : lines, 
			rowPosition   : this.rowPosition,
			counted       : (counted?(counted+1):0), 
			dataStart     : this.dataStart, 
			dataLimit     : this.dataLimit, 
			divstyle      : d.style.cssText
		} );
		
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
		//this.counted = 0;
		let counted = 0;
		
		let lines = [];
		let lastline = null;
		let startline = null;
		
		for( let a = 0, b = this.rowPosition, c = 0; a < this.rowCount; a++, b++, c += this.config.rowHeight )
		{
			if( b >= this.length( this.myArray ) ) break;
			let row = this.createDiv( false, bb, b, 'RowElement Line ' + b, 'Line ' + b );
			//row.style.top = c + 'px';
			//row.style.background = 'green';
            
			lines.push( b );
			
			startline = ( startline != null ? startline : b );
			lastline = b;
			
			//this.counted = a;
			counted = a;
		}
		
		// Add to limit
		//this.dataLimit += this.counted;
		this.dataLimit += (counted?(counted+1):0);
		
		this.counted += (counted?(counted+1):0);
		
		//bb.style.position = 'absolute';
		//bb.style.width = '100%';
		bb.style.top = d.offsetTop + d.offsetHeight + 'px';
		bb.style.height = counted * this.config.rowHeight + 'px';
		this.list.replaceChild( bb, this.elements.pageBelow );
		this.elements.pageBelow = bb;
		
		console.log( '[3] pageBelow top: ' + bb.style.top, { 
			startline   : (startline?startline:0), 
			lastline    : (lastline?lastline:0), 
			lines       : lines, 
			rowPosition : this.rowPosition,
			counted     : (counted?(counted+1):0), 
			dataStart   : this.dataStart, 
			dataLimit   : this.dataLimit, 
			divstyle    : bb.style.cssText
		} );
		
		return bb;
		
	},
	
	distribute: function( data, start, total, force )
	{
		
		//console.log( { data: data, start: start, total: total } );
		
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
			this.refresh();
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
						//console.log( 'We have no cache image!' );
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
					
					if( elements[a][b].line != null )
					{
						allNodes[ elements[a][b].line ] = elements[a][b];
					}
					else
					{
						allNodes[ i ] = elements[a][b];
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
		this.viewHeight   = this.list.clientHeight/*window.innerHeight*/;
		this.scrollHeight = ( this.config.rowHeight * this.length( this.myArray ) );
		
		// Some vars
		let list = this.list;
		
		let scrollTop    = this.scrollTop;
		let viewHeight   = this.viewHeight;
		let scrollHeight = this.scrollHeight;
		
		let pm = this.elements.pageMiddle;
		
		// Must redraw if pageMiddle is out of scroll view
		
		let redraw = false;
		
		// [1] If pageMiddle is not visible within the scroll view then redraw
		
		if( scrollTop > pm.offsetTop + pm.offsetHeight )
		{
			redraw = true;
		}
		
		// [2] If pageMiddle is not visible within the scroll view then redraw
		
		if( scrollTop + viewHeight < pm.offsetTop )
		{
			redraw = true;
		}
		
		// [3] At every refresh where content is within the scroll view redraw
		
		if( scrollTop < viewHeight )
		{
			redraw = true;
		}
		
		// [4] If scrollarea is resized or just argument force is passed as true then redraw
		
		if( force === true )
		{
			redraw = true;
		}
		
		if( this.debug )
		{
			console.log( "\r\n" );
			console.log( '[1] '+scrollTop+' > '+pm.offsetTop+' + '+pm.offsetHeight+' | scrollTop > pm.offsetTop + pm.offsetHeight '+(scrollTop>pm.offsetTop+pm.offsetHeight?'(true)':'(false)') );
			console.log( '[2] '+scrollTop+' + '+viewHeight+' < '+pm.offsetTop+' | scrollTop + viewHeight < pm.offsetTop '+(scrollTop+viewHeight<pm.offsetTop?'(true)':'(false)') );
			console.log( '[3] '+scrollTop+' < '+viewHeight+' | scrollTop < viewHeight '+(scrollTop<viewHeight?'(true)':'(false)') );
			console.log( '[4] '+(force?true:false)+' === '+true+' | force === true '+(force===true?'(true)':'(false)') );
			console.log( "\r\n" );
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
		
		let aaa, ddd, bbb = null;
		
		if( this.config.mustRedraw )
		{
		    // TODO: Get latest database rows into myArray
		    
		    this.config.mustRedraw = false;
		    
		    this.rowPosition = Math.floor( scrollTop / this.config.rowHeight );
		    this.rowCount    = Math.floor( viewHeight / this.config.rowHeight ) + 1;
		    
		    this.dataStart = this.rowPosition;
		    
		    if( this.debug )
		    {
		    	console.log( '[5] '+scrollTop+' > '+viewHeight+' | scrollTop > viewHeight '+(scrollTop>viewHeight?'(true)':'(false)') );
	    		console.log( "\r\n" );
	    	}
		    
		    // Page above
		    if( scrollTop > viewHeight )
		    {
		    	let aaa = this.pageAbove();
		    }
		    else
		    {
		    	this.emptyDiv( 'pageAbove' );
		    }
		    
		    // Page middle
		    let ddd = this.pageMiddle();
			
		    // Page below
		    let bbb = this.pageBelow();
		    
		    if( this.debug || 1==1 )
		    {
				console.log( '[4] refresh', {
					dataStart    : { a: this.dataStart, b: this.dataPrevStart },
					dataLimit    : { a: this.dataLimit, b: this.dataPrevLimit },
					rowCount     : this.rowCount,
					leftToScroll : leftToScroll,
					counted      : this.counted,
					myArray      : this.myArray,
					total        : this.total
				} );
		    }
		    
		    // TODO: Find out why 1 is missing when scrolling between page above, middle, below ...
		    
		    if( ( this.dataPrevStart != null && this.dataStart != this.dataPrevStart ) || ( this.dataPrevLimit != null && this.dataLimit != this.dataPrevLimit ) )
		    //if( ( this.dataPrevStart != null && this.dataStart != this.dataPrevStart ) && ( this.dataPrevLimit != null && this.dataLimit != this.dataPrevLimit ) )
		    {
		    	if( this.debug/* || 1==1*/ ) console.log( 'FETCH!!!! ' );
		    	
		    	
		    	
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
		    	
		    	//return;
		    	
		    }
		    if( this.debug ) console.log( { ddd:(ddd?ddd:false), bbb:(bbb?bbb:false) } );
		}
		// TODO: What happened to dd and bb here???
		if( this.debug/* || 1==1*/ ) console.log( this.counted+' >= '+this.length( this.myArray ), { ddd:(ddd?ddd:false), bbb:(bbb?bb:false) } );
		// If we counted the whole list, then
		if( this.counted >= this.length( this.myArray ) && ddd && bbb )
		{
			//console.log( '[1]' );
	    	let hh = Math.max( ddd.offsetTop + ddd.offsetHeight, bbb.offsetTop + bbb.offsetHeight );
	    	this.elements.wholeHeight.style.height = hh + 'px';
		}
		// Else, use scrollHeight
		else
		{
			//console.log( '[2]' );
		    this.elements.wholeHeight.style.height = scrollHeight + 'px';
		}
		
		// Add debug
		if( this.debug && 1!=1 ) this.debugInfo( scrollTop + ' scroll ' + "\r\n<br>" + viewHeight + ' height ' + "\r\n<br>" + this.ex );
		
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
		
		this.selectedLine = null;
		
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



