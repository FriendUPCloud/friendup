'use strict';

function fun() {
	createDOSToken( lcBack, 5, 5000 );
	
	function lcBack( data ) {
        listTokens( ldBack );
    }
	/*
    createDOSToken( lcBack );
    
    
    */
    function ldBack( data ) {
        if ( !data )
            return;
        
        data.forEach( getDetails );
        console.log("get deails: " + data );
        
        function getDetails( token ) {
            let id = token.tokenid;
            if ( !id ) {
                console.log( 'no id for', token );
                return;
            }
            testToken( id, null );
        }
    }
    
    
    function createDOSToken( callback, times, timeout ) {
        const test = 'token/create';
        start( test );
        const args = {
            times      : times,
            timeout    : timeout,
        };
        call( 'token/create', args, test, listBack );
        function listBack( res ) {
            end( test, res );
            callback( res );
        }
    }
    
    function listTokens( callback ) {
        const test = 'token/list';
        start( test );
        call( 'token/list', { details : true }, test, deetsBack );
        function deetsBack( res ) {
            end( test, res );
            if( callback != null )
	            callback( res );
        }
    }
    
    function testToken( id, callback ) {
        const test = 'file/read, dostoken=' + id;
        start( test );
        const args = {
            dostoken      : id,
        };
        console.log("Test file/read. DOSToken = " + id );
        call( 'file/read', args, test, nodeBack );
        function nodeBack( res ) {
            end( test, res );
            if( callback != null )
	            callback( res );
        }
    }
}

function call( path, args, test, callback ) {
    const lib = new Library( 'system.library' );
    lib.onExecuted = libBack;
    lib.execute( path, args );
    
    function libBack( err, res ) {
        const data = handleRes( err, res, test );
        callback( data );
    }
}

function handleRes( err, res, test ) {
    var data = null;
    
    console.log("ERR: " + err + " - " + res + " - " + test );
    
    if ( 'ok' !== err.toLowerCase()) {
        console.log( 'error in ' + test + ' -- ', {
            err : err,
            res : res,
        });
        return null;
    }
    
    try {
        data = JSON.parse( res );
    } catch( e ) {
        console.log( 'could not parse result of ' + test + ' -- ', res );
        return null;
    }
    
    return data;
}

function start( test ) {
    console.log( '>>> ' + test );
}

function end( test, res ) {
    console.log( '<<< ' + test, res );
}

function failed( test, err ) {
    console.log( 'test failed: ' + test );
}

Application.run = fun;