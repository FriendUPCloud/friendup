/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIRadiobox extends FUIElement
{
    constructor( options )
    {
        super( options );
        if( options.value )
            this.value = options.value;
        if( options.elements )
            this.elements = options.elements;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'FUI', 'FUIRadiobox' );
        
        this.refreshDom();
    }
    refreshDom()
    {
        let self = this;
        
        if( this.changed )
        {
            // Gui containers
            let str = '';
            
            if( this.elements && this.elements.length )
            {
                for( let a in this.elements )
                {
                    let e = this.elements[ a ];
                    str += '<div class="FUIRadioElement">';
                    str += '<div class="FUIRadioToggle">' + e.label + '</div>';
                    str += '</div>';
                }
            }
            
            this.domElement.innerHTML = str;
            
            // Events
            let radios = this.domElement.getElementsByClassName( 'FUIRadioElement' );
            for( let a = 0; a < radios.length; a++ )
            {
                ( function( r, item, ele ){
                    r.onclick = function()
                    {
                        self.value = ele.value;
                        if( self.options.onchange )
                        {
                            // Trigger callback
                            if( window.FUI.callbacks[ self.options.onchange ] )
                            {
                                // Add structure with current element flags
                                window.FUI.callbacks[ self.options.onchange ]( self.value );
                            }
                        }
                        self.refreshDom();
                    }
                } )( radios[ a ], a, this.elements[ a ] );
            }
            
            this.changed = false;
        }
        
        let radios = this.domElement.getElementsByClassName( 'FUIRadioElement' );
        for( let a = 0; a < this.elements.length; a++ )
        {
            if( this.elements[a].value == this.value )
            {
                radios[a].classList.add( 'FUISelected' );
            }
            else
            {
                radios[a].classList.remove( 'FUISelected' );
            }
        }
    }
    grabAttributes( domElement )
    {
        let val = domElement.getAttribute( 'value' );
        if( val ) 
            this.value = parseFloat( val );
    
        let elements = domElement.getElementsByTagName( 'radioelement' );
        if( !elements || !elements.length ) return;
        
        this.elements = [];
        for( let a = 0; a < elements.length; a++ )
        {
            let el = elements[a];
            let e = {
                selected: el.getAttribute( 'selected' ) == 'selected' ? true : false,
                label: el.getAttribute( 'label' ) ? el.getAttribute( 'label' ): '',
                value: el.getAttribute( 'value' )
            };
            if( e.selected )
            {
                this.value = e.value;
            }
            this.elements.push( e );
        }
        
        // Support onchange
        if( domElement.getAttribute( 'onchange' ) )
        {
            this.setOptions( { onchange: domElement.getAttribute( 'onchange' ) } );
        }
        
        this.changed = true;
        
        this.refreshDom();
    }
}
FUI.registerClass( 'radiobox' );

// Checkbox element
class FUICheckbox extends FUIElement
{
    constructor( options )
    {
        super( options );
        if( options && options.checked )
            this.checked = options.checked;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.onclick = function()
        {
            if( self.checked )
            {
                self.domElement.classList.remove( 'FUIChecked' );
                self.checked = false;
            }
            else
            {
                self.domElement.classList.add( 'FUIChecked' );
                self.checked = true;
            }
            if( self.options.onchange )
            {
                // Trigger callback
                if( window.FUI.callbacks[ self.options.onchange ] )
                {
                    // Add structure with current element flags
                    window.FUI.callbacks[ self.options.onchange ]( self.checked );
                }
            }
        }
        
        this.domElement.classList.add( 'FUI', 'FUICheckbox' );
        
        this.domElement.innerHTML = '<div class="FUIGroove"><div class="FUIButton"></div></div>';
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        if( domElement.getAttribute( 'checked' ) )
        {
            this.checked = domElement.getAttribute( 'checked' ) != '' ? true : false;
        }
        else
        {
            this.checked = false;
        }
        
        // Support onchange
        if( domElement.getAttribute( 'onchange' ) )
        {
            this.setOptions( { onchange: domElement.getAttribute( 'onchange' ) } );
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Make sure we see checked
        if( this.checked )
        {
            this.domElement.classList.add( 'FUIChecked' );
        }
        else
        {
            this.domElement.classList.remove( 'FUIChecked' );
        }
    }
    getMarkup( data )
    {
    	let str = '<checkbox {options}/>';
    	let opts = [];
    	for( let a in data )
    	{
    		if( a == 'OnChange' )
    		{
    			opts.push( 'onchange="' + data[a] + '"' );
    		}
    		if( a == 'Value' && data[a] )
    		{
    			opts.push( 'checked="checked"' );
    		}
    	}
    	if( opts.length )
    	{
    		str = str.split( '{options}' ).join( opts.join( ' ' ) );
    	}
    	else
    	{
    		str = str.split( ' {options}' ).join( '' );
    	}
    	return str;
    }
}
FUI.registerClass( 'checkbox', FUICheckbox );

class FUIItembox extends FUIElement
{
    constructor( options )
    {
        super( options );
        if( options.onsubmit )
            this.onsubmit = options.onsubmit;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'FUI', 'FUIItembox', 'BordersDefault', 'Padding', 'MarginBottom' );
        
        this.domElement.innerHTML = '<div class="FUIForm HRow">\
            <div class="HContent20 Ellipsis FloatLeft"><p class="InputHeight"><strong>Group name:</strong></p></div>\
            <div class="HContent80 Ellipsis FloatLeft"><input type="text" class="FullWidth InputHeight"/></div>\
        </div>\
        <div class="FUIForm HRow MarginTop">\
            <div class="HContent20 Ellipsis FloatLeft"><p class="InputHeight"><strong>Description:</strong></p></div>\
            <div class="HContent80 Ellipsis FloatLeft"><textarea class="FullWidth" rows="5"></textarea></div>\
        </div>\
        <div class="FUIForm HRow MarginTop">\
            <div class="HContent100 Ellipsis FloatLeft TextRight"><button class="Button IconSmall fa-plus" type="button"></button></div>\
        </div>';
        
        // Set up events
        let inp = this.domElement.getElementsByTagName( 'input' )[0];
        let txt = this.domElement.getElementsByTagName( 'textarea' )[0];
        let btn = this.domElement.getElementsByTagName( 'button' )[0];
        btn.onclick = function()
        {
            // Trigger callback
            if( window.FUI.callbacks[ self.options.onsubmit ] )
            {
                // Add structure with current element flags
                window.FUI.callbacks[ self.options.onsubmit ]( { name: inp.value, description: txt.value } );
            }
        }
        setTimeout( function()
        {
            inp.focus();
        }, 5 );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        // Support onchange
        if( domElement.getAttribute( 'onsubmit' ) )
        {
            this.setOptions( { onsubmit: domElement.getAttribute( 'onsubmit' ) } );
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Make sure we see checked
        if( this.checked )
        {
            this.domElement.classList.add( 'FUIChecked' );
        }
        else
        {
            this.domElement.classList.remove( 'FUIChecked' );
        }
    }
}
FUI.registerClass( 'itembox' );

/* Image class */
class FUIPicture extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'FUI', 'FUIPicture' );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ 'width', 'height', 'icon', 'type', 'shape', 'border-size', 'onclick' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Do something with properties on dom
        
        if( this.options.width )
        {
            this.domElement.style.width = this.options.width;
        }
        if( this.options.height )
        {
        	this.domElement.style.height = this.options.height;
        }
        
        let exClasses = '';
        
        if( this.options.shape )
        {
        	if( this.options.shape == 'circle' )
        	{
        		this.domElement.style.borderRadius = '100%';
        	}
        	else
        	{
        		this.domElement.style.borderRadius = '';
        	}
        }
        if( this.options[ 'border-size' ] )
        {
        	this.domElement.style.borderWidth = this.options[ 'border-size' ];
    		this.domElement.style.borderStyle = 'solid';
        }
        else
        {
        	this.domElement.style.borderWidth = '';
        }
        
        if( this.options[ 'onclick' ] )
        {
        	this.domElement.style.cursor = 'pointer';
        	this.domElement.onclick = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onclick ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onclick ]( true );
		        }
		        return;
        	}
        }
        
        // Set stuff on this.domElement.innerHTML
        if( this.options.type == 'icon' )
        {
        	let icon = this.options.icon ? ( 'fa-' + this.options.icon ) : 'fa-info';
        	this.domElement.innerHTML = '<div class="IconSmall ' + icon + exClasses + '"></div>';
        	if( this.options[ 'border-size' ] )
        	{
        		let d = this.domElement.getElementsByTagName( 'div' )[0];
        		d.style.marginTop = -( this.options[ 'border-size' ] ) + 'px';
        	}
        }
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	
    	let str = '<picture {options}/>';
    	let opts = [];
    	for( let a in data )
    	{
    		if( a == 'width' )
    		{
    			opts.push( 'width="' + data[a] + '"' );
    		}
    		if( a == 'height' && data[a] )
    		{
    			opts.push( 'height="' + data[a] + '"' );
    		}
    		if( a == 'type' && data[a] )
    		{
    			opts.push( 'type="' + data[a] + '"' );
    		}
    	}
    	if( opts.length )
    	{
    		str = str.split( '{options}' ).join( opts.join( ' ' ) );
    	}
    	else
    	{
    		str = str.split( ' {options}' ).join( '' );
    	}
    	return str;
    }
}
FUI.registerClass( 'picture' );

// Textarea element
class FUITextarea extends FUIElement
{
    constructor( options )
    {
        super( options ); 
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.adaptSize();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'uniqueid', 'icon', 'onchange' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        this.domElement.classList.add( 'FUITextareaContainer' );
        
        let self = this;
        
        // Class for dom element
        let cl = '';
        if( this.options[ 'icon' ] )
        {
            cl += ' IconSmall fa-' + this.options[ 'icon' ];
        }
        
        // TODO: Add properties, uniqueId etc
        this.domElement.innerHTML = '<div class="FUITextareaElement' + cl + '"><textarea>' + ( this.options.innerHTML ? this.options.innerHTML : '' ) + '</textarea></div>';
        
        // Sets onchange and onkeyup on input element
        if( this.options[ 'onchange' ] )
        {
        	let inp = this.domElement.getElementsByTagName( 'textarea' )[0];
        	inp.onchange = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onchange ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onchange ]( inp.value );
		        }
		        return;
        	}
        	inp.onkeyup = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onchange ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onchange ]( inp.value );
		        }
		        return;
        	}
        }
        
        this.adaptSize();
    }
    setValue( string )
    {
    	this.domElement.getElementsByTagName( 'textarea' )[0].value = string;
    }
    getValue()
    {
    	return this.domElement.getElementsByTagName( 'textarea' )[0].value;
    }
    focus()
    {
    	return this.domElement.getElementsByTagName( 'textarea' )[0].focus();
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'icon', 'uniqueid', 'onchange' ];
        let attrStr = [];
        
        // Build an array of attributes
        for( let a in attrs )
        {
        	let op = this.options[ attrs[ a ] ]
        	if( op )
        	{
	        	attrStr.push( attrs[ a ] + '="' + op + '"' );
	        } 
        }
        if( attrStr.length > 0 )
        {
            attrStr = ' ' + attrStr.join( ' ' );
        }
        else attrStr = '';
    	return '<fui-textarea' + attrStr + '>' + ( this.options.value ? this.options.value : '' ) + '</fui-textarea>';
    }
    adaptSize()
    {
    	// TODO:
    }
}
FUI.registerClass( 'textarea', FUITextarea );

// String element
class FUIString extends FUIElement
{
    constructor( options )
    {
        super( options ); 
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.adaptSize();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'uniqueid', 'icon', 'onchange' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Class for dom element
        let cl = '';
        if( this.options[ 'icon' ] )
        {
            cl += ' IconSmall fa-' + this.options[ 'icon' ];
        }
        
        // TODO: Add properties, uniqueId etc
        this.domElement.innerHTML = '<div class="FUIStringElement' + cl + '"><input type="string" value="' + ( this.options.innerHTML ? this.options.innerHTML : '' ) + '"/></div>';
        
        // Sets onchange and onkeyup on input element
        if( this.options[ 'onchange' ] )
        {
        	let inp = this.domElement.getElementsByTagName( 'input' )[0];
        	inp.onchange = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onchange ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onchange ]( inp.value );
		        }
		        return;
        	}
        	inp.onkeyup = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onchange ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onchange ]( inp.value );
		        }
		        return;
        	}
        }
        
        this.adaptSize();
    }
    setValue( string )
    {
    	this.domElement.getElementsByTagName( 'input' )[0].value = string;
    }
    getValue()
    {
    	return this.domElement.getElementsByTagName( 'input' )[0].value;
    }
    focus()
    {
    	return this.domElement.getElementsByTagName( 'input' )[0].focus();
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'icon', 'uniqueid', 'onchange' ];
        let attrStr = [];
        
        // Build an array of attributes
        for( let a in attrs )
        {
        	let op = this.options[ attrs[ a ] ]
        	if( op )
        	{
	        	attrStr.push( attrs[ a ] + '="' + op + '"' );
	        } 
        }
        if( attrStr.length > 0 )
        {
            attrStr = ' ' + attrStr.join( ' ' );
        }
        else attrStr = '';
    	return '<fui-string' + attrStr + '>' + ( this.options.value ? this.options.value : '' ) + '</fui-string>';
    }
    adaptSize()
    {
    	// Adapt size if button is higher!
        let p = this.domElement.parentNode;
        if( p )
        {
        	let d = this.domElement.querySelector( '.FUIStringElement' );
        	
        	let h = p.offsetHeight;
        	let styles = getComputedStyle( p );
        	h -= parseInt( styles.paddingTop ) + parseInt( styles.paddingBottom );
        	
		    if( d && d.offsetHeight > h )
		    {
		    	d.style.height = h + 'px';
		    	if( h < 20 )
		    		d.style.lineHeight = '0.9';
		    	if( h < 20 )
		    		d.style.fontSize = 'var(--font-size-small)';
		    	else d.style.fontSize = '';
		    }
		}
    }
}
FUI.registerClass( 'string', FUIString );

// Button element
class FUIButton extends FUIElement
{
    constructor( options )
    {
        super( options ); 
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.adaptSize();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'uniqueid', 'icon', 'onclick' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Class for dom element
        let cl = '';
        if( this.options[ 'onclick' ] )
        {
        	this.domElement.style.cursor = 'pointer';
        	this.domElement.onclick = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onclick ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onclick ]( true );
		        }
		        return;
        	}
        	cl += ' Clickable';
        }
        if( this.options[ 'icon' ] )
        {
            cl += ' IconSmall fa-' + this.options[ 'icon' ];
        }
        
        // TODO: Add properties, uniqueId etc
        this.domElement.innerHTML = '<div class="FUIButtonElement' + cl + '">' + ( this.options.innerHTML ? this.options.innerHTML : '' ) + '</div>';
        
        this.adaptSize();
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'icon', 'onclick' ];
        let attrStr = [];
        
        // Build an array of attributes
        for( let a in attrs )
        {
        	let op = this.options[ attrs[ a ] ]
        	if( op )
        	{
	        	attrStr.push( attrs[ a ] + '="' + op + '"' );
	        } 
        }
        if( attrStr.length > 0 )
        {
            attrStr = ' ' + attrStr.join( ' ' );
        }
        else attrStr = '';
    	return '<fui-button' + attrStr + '>' + ( this.options.value ? this.options.value : '' ) + '</fui-button>';
    }
    adaptSize()
    {
    	// Adapt size if button is higher!
        let p = this.domElement.parentNode;
        if( p )
        {
        	let d = this.domElement.querySelector( '.FUIButtonElement' );
        	
        	let h = p.offsetHeight;
        	let styles = getComputedStyle( p );
        	h -= parseInt( styles.paddingTop ) + parseInt( styles.paddingBottom );
        	
		    if( d && d.offsetHeight > h )
		    {
		    	d.style.height = h + 'px';
		    	if( h < 20 )
		    		d.style.lineHeight = '0.9';
		    	if( h < 20 )
		    		d.style.fontSize = 'var(--font-size-small)';
		    	else d.style.fontSize = '';
		    }
		}
    }
}
FUI.registerClass( 'button', FUIButton );

// Button element
class FUIText extends FUIElement
{
    constructor( options )
    {
        super( options ); 
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.adaptSize();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'uniqueid', 'size', 'icon', 'onclick' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Class for dom element
        let cl = '';
        
        if( this.options[ 'onclick' ] )
        {
        	this.domElement.style.cursor = 'pointer';
        	this.domElement.onclick = function( e )
        	{
        		cancelBubble( e );
        		if( window.FUI.callbacks[ self.options.onclick ] )
		        {
		            // Add structure with current element flags
		            window.FUI.callbacks[ self.options.onclick ]( true );
		        }
		        return;
        	}
        	cl += ' Clickable ';
        }
        if( this.options[ 'icon' ] )
        {
            cl += ' IconSmall fa-' + this.options[ 'icon' ];
        }
        
        // TODO: Add properties, uniqueId etc
        this.domElement.innerHTML = '<div class="FUITextElement' + cl + '">' + ( this.options.innerHTML ? this.options.innerHTML : '' ) + '</div>';
        
        this.adaptSize();
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'sze', 'icon', 'onclick' ];
        let attrStr = [];
        
        // Build an array of attributes
        for( let a in attrs )
        {
        	let op = this.options[ attrs[ a ] ]
        	if( op )
        	{
	        	attrStr.push( attrs[ a ] + '="' + op + '"' );
	        } 
        }
        if( attrStr.length > 0 )
        {
            attrStr = ' ' + attrStr.join( ' ' );
        }
        else attrStr = '';
    	return '<fui-text' + attrStr + '>' + ( this.options.value ? this.options.value : '' ) + '</fui-text>';
    }
    adaptSize()
    {
    	// TODO
    }
}
FUI.registerClass( 'text', FUIText );

// SimpleHTML element
class FUIHTML extends FUIElement
{
    constructor( options )
    {
        super( options ); 
    }
    attachDomElement()
    {
        super.attachDomElement();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ /*'width', 'height', 'icon', 'type', 'shape', 'border-size',*/ 'uniqueid' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Class for dom element
        let cl = '';
        
        // TODO: Add properties, uniqueId etc
        this.domElement.innerHTML = '<div class="FUIHTML' + cl + '"></div>';
        if( this.options.childNodes )
        {
        	let fml = this.domElement.getElementsByTagName( 'div' )[0];
	        let cn = this.options.childNodes;
	        for( let a = 0; a < cn.length; a++ ) fml.appendChild( cn[a] );
	    }
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let attrs = [ 'uniqueid' ];
        let attrStr = [];
        
        // Build an array of attributes
        for( let a in attrs )
        {
        	let op = this.options[ attrs[ a ] ]
        	if( op )
        	{
	        	attrStr.push( attrs[ a ] + '="' + op + '"' );
	        } 
        }
        if( attrStr.length > 0 )
        {
            attrStr = ' ' + attrStr.join( ' ' );
        }
        else attrStr = '';
    	return '<fui-html' + attrStr + '>' + ( this.options.value ? this.options.value : '' ) + '</fui-html>';
    }
}
FUI.registerClass( 'html', FUIHTML );

