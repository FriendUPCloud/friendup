<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/



// SQL Database abstraction ------------------------------------------------
class SqlDatabase
{
	var $_database, $_username, $_password, $_hostname;
	var $_type;
	var $_link;
	var $_lastQuery;
	var $_queryCount;
	var $_lastResult;
	var $_lastError;
	
	// Cache for return types
	var $_cacheObj;
	var $_cacheObjArray;
	var $_cacheArr;
	var $_cacheArrArray;
	
	// Instantiation - type is unimplemented
	function __construct( $type = false )
	{
		$this->_type = 'mysql';
	}
	
	// Initialize cache
	function InitCache()
	{
		$this->_cacheObj = array();
		$this->_cacheObjArray = array();
		$this->_cacheArr = array();
		$this->_cacheArrArray = array();
	}
	
	// Open a connection to a database
	function Open( $host, $user, $pass )
	{
		if( $this->_link = mysqli_connect( $host, $user, $pass ) )
		{
			mysqli_set_charset( $this->_link, 'utf8' );
			return true;
		}
		return false;
	}

	// Close a connection
	function Close()
	{
		if( $this->_link )
		{
			$this->Flush();
			return mysqli_close( $this->_link );
		}
	}

	// Select a database
	function SelectDatabase( $database )
	{
		if( !$this->_link ) return false;
		return mysqli_select_db( $this->_link, $database);
	}
	// Select done
	
	// Flush debug vars
	function Flush()
	{
		unset( $this->_lastQuery );
		unset( $this->_lastResult );
		unset( $this->_lastError );
		$this->InitCache();
	}
	// Flush done
	
	// Query the database
	function Query( $query )
	{
		global $Logger;
		if( !$this->_link ) return false;
		
		// Delete cache when writing to database
		$part = strtoupper( substr( $query, 0, 6 ) );
		if( $part == 'UPDATE' || $part == 'INSERT' || $part == 'DELETE' )
			$this->InitCache();
		
		$this->_queryCount++;
		$this->_lastQuery = $query;
		
		if( $res = mysqli_query( $this->_link, $query ) )
		{
			$this->_lastResult = $res;
			return $res;
		}
		$this->_lastError = mysqli_error( $this->_link );
		return false;
	}
	// Query done
	
	// Fetch an array of rows
	function FetchArray( $query )
	{
		// Recall cache
		if( isset( $this->_cacheArrArray[$query] ) )
			return $this->_cacheArrArray[$query];
			
		if( $res = $this->Query( $query ) )
		{
			$result = array();
			while( $ar = mysqli_fetch_array( $res, MYSQLI_ASSOC) )
			{
				$result[] = $ar;
			}
			// Write cache
			$this->_cacheArrArray[$query] = $result;
			
			// Return result
			return $result;
		}
		return false;
	}
	
	function FreeResult( $result )
	{
		if( $this->_lastResult == $result )
			$this->_lastResult = null;
		mysqli_free_result( $result );
	}
	
	function FetchRow( $query )
	{
		global $Logger;
		
		// Recall cache
		if( isset( $this->_cacheArr[$query] ) )
			return $this->_cacheArr[$query];
		
		if( $res = $this->Query( $query ) )
		{
			$result = False;
			$num = mysqli_num_rows( $res );
			if( $num > 0 )
			{
				$result = false;
				if( $result = mysqli_fetch_assoc( $res ) )
				{
					// Write cache
					$this->_cacheArr[$query] = $result;
				}
			}
			$this->FreeResult( $res );
			return $result;
		}
		return false;
	}
	
	function FetchObjects( $query )
	{
		// Recall cache
		if( isset( $this->_cacheObjArray[$query] ) )
			return $this->_cacheObjArray[$query];

		if( $res = $this->Query( $query ) )
		{
			$result = false;
			$num = mysqli_num_rows( $res );
			if( $num > 0 )
			{
				$result = array();
				while( $rowo = mysqli_fetch_object( $res ) )
				{
					$result[] = $rowo;
				}
				$this->_cacheObjArray[$query] = $result;
			}
			$this->FreeResult( $res );
			return $result;
		}
		return false;
	}
	
	function FetchObject( $query )
	{
		// Recall cache
		if( isset( $this->_cacheObj[$query] ) )
			return $this->_cacheObj[$query];
		
		if( $res = $this->Query( $query ) )
		{
			$result = mysqli_fetch_object( $res );
			$this->_cacheObj[$query] = $result;
			$this->FreeResult( $res );
			return $result;
		}
		return false;
	}
	
	function MakeGlobal()
	{
		$GLOBALS[ 'SqlDatabase' ] =& $this;
	}

	function EscapeString($s, $strict = FALSE)
	{
        if ($strict)
        {
            $replace_from = array('_', '%');
            $replace_to   = array('\_', '\%');
            return str_replace($replace_from, $replace_to, mysqli_real_escape_string($this->_link, $s));
        }
        else
        {
            return mysqli_real_escape_string($this->_link, $s);
        }
	}
}

// SQL Database table abstraction ------------------------------------------
class DbTable
{
	var $_database;
	var $_primarykeys;
	var $_fieldnames;
	var $_autofields; // fields that automatically gets a value
	
	function __construct( $name = false, $database = false )
	{
		if( $database )
			$this->_database = &$database;
		else $this->_database = &$GLOBALS[ 'SqlDatabase' ];
		
		$this->_name = $name;
		$this->LoadTable();
	}
	
	// Support anonymous functions
	function __call( $method, $args )
	{
		if( isset( $this->$method ) )
		{
			$func = $this->$method;
			call_user_func_array( $func, $args );
		}
	}
	
	// Load information about a table
	function LoadTable( $name = false )
	{
		if( !$this->_database ) return false;
		if( !$name && !$this->_name ) return false;
		else if( $name ) $this->_name = $name;
		
		if( method_exists( $this, 'OnLoad' ) )
			$this->OnLoad();
			
		if( $result = $this->_database->FetchArray( "DESCRIBE `{$this->_name}`" ) )
		{
			$this->_primarykeys = array();
			$this->_fieldnames = array();
			$this->_fieldtypes = array();
			$this->_autofields = array();
			foreach( $result as $row )
			{
				$this->_fieldnames[] = $row[ 'Field' ];
				$this->_fieldtypes[] = preg_replace( '/\(.*\)/', '', $row[ 'Type' ] );
				$this->{$row['Field']} = null;
				if( $row[ 'Key' ] == 'PRI' )
				{
					if( $row['Extra'] == 'auto_increment' )
						$this->_autofields[] = $row[ 'Field' ];
					$this->_primarykeys[] = $row[ 'Field' ];
				}
			}
			if( method_exists( $this, 'OnLoaded' ) )
				$this->OnLoaded();
			return true;
		}
		return false;
	}
	
	function EncapsulateField( $fieldname, $value )
	{
		$c = count( $this->_fieldnames );
		
		// Illegal value!
		if( is_object( $value ) )
			$value = '';
			
		for( $b = 0; $b < $c; $b++ )
		{
			if( $this->_fieldnames[ $b ] == $fieldname )
			{
				switch( strtolower( $this->_fieldtypes[ $b ] ) )
				{
					case 'int':
					case 'bigint':
					case 'double':
					case 'tinyint':
						$value = str_replace( "'", "", $value );
						if( $value == '' ) $value = 0;
						return "'$value'";
						
					case 'datetime':
					default:
						$value = stripslashes( $value );
						$value = str_replace( '\"', '"', $value );
						$value = str_replace( '"', '\"', $value );
						return '"' . $value . '"';
				}
			}
		}
		return $value;
	}
	
	// Add a field to a table
	function AddField( $fieldname, $type, $options = false )
	{
		$size = false;
		$auto_increment = false;
		$default_value = '""';
		$null = false;
		$after = false;
	
		switch( strtolower( $type ) )
		{
			case 'varchar':
				if( !$options['size'] )
					$size = 255;
				break;
			case 'tinyint':
				if( !$options['size'] )
					$size = 4;
				break;
			case 'int':
				if( !$options['size'] )
					$size = 11;
				break;
			case 'datetime':
				if( !$options['size'] )
				{
					$size = 0;
					$default_value = '';
				}
				break;
			case 'bigint':
				if( !$options['size'] )
				{
					$size = 20;
					$default_value = '';
				}
				break;
			case 'text':
				$size = 0;
				$default_value = '';
				break;
		}
		
		if( isset( $options[ 'after' ] ) )
			$after = $options[ 'after' ];
		if( isset( $options[ 'null' ] ) )
			$null = $options[ 'null' ];
		if( isset( $options[ 'auto_increment' ] ) )
			$auto_increment = $options[ 'auto_increment' ];
		if( isset( $options[ 'default_value' ] ) )
			$default_value = $options[ 'default_value' ];
		
		return $this->_database->Query( '
			ALTER TABLE `' . $this->_name . '`
			ADD `' . $fieldname . '` ' . strtoupper( $type ) . 
				( $size > 0 ?( '(' . $size . ')' ) : '' ) . 
				( $default_value ?( ' DEFAULT ' . $default_value ) : '' ) .
				( $auto_increment ? ' auto_increment' : '' ) .
				( $null ? '' : ' NOT NULL' ) . 
				( $after ?( ' AFTER `' . $after . '`' ) : '' ) . '
		' );
	}
}

// SQL Database row abstraction --------------------------------------------
class DbIO extends DbTable
{
	var $_debug;
	var $_orderBy;
	var $_where;
	var $_limit;
	var $_position;
	
	function __construct( $TableName = false, $database = false )
	{
		if( $database )
			$this->_database = $database;
		else $this->_database = false;
		parent::__construct( $TableName, $this->_database );
		$this->_debug = false;
	}
	
	// Function to get last inserted id 
	function GetLastInsertId()
	{
		$r = $this->_database->FetchRow( 'SELECT LAST_INSERT_ID() ID' );
		return $r['ID'];
	}

	// Loads with vararg(primary keys)
	function Load()
	{
		global $Logger;
		
		if( !$this->_primarykeys )
			return false;
		
		if( method_exists( $this, 'OnLoad' ) ) $this->OnLoad();
			
		// Set primary keys
		$num = func_num_args();
		if( $num > 0 )
		{
			// Clear up all fields
			foreach( $this->_fieldnames as $v )
				$this->$v = null;
				
			$keys = array();
			for( $a = 0; $a < $num; $a++ )
			{
				$keys[] = func_get_arg( $a );
			}
			$a = 0;
			foreach( $this->_primarykeys as $k )
				$this->$k = $keys[ $a++ ];
			// Check that we have all primary keys
			foreach( $this->_primarykeys as $k )
			{
				if( $this->$k <= 0 ) 
				{
					$this->_lastError = 'Primary key(' . $k . ') empty.';
					return false;
				}
			}
		}
		$query = '';
		$where = array();
		foreach( $this->_fieldnames as $k=>$v )
		{
			// Skip some types
			$type = $this->_fieldtypes[$k];
			$skip = false;
			switch( $type )
			{
				case 'blob':
				case 'longblob':
				case 'mediumblob':
					$skip = true;
					break;
			}
			
			if( !$skip && $this->$v != null )
			{
				$where[] = "`$v` = " . $this->EncapsulateField( $v, $this->$v );
			}
		}
		$query = "SELECT * FROM `{$this->_name}` WHERE " . implode( " AND ", $where );
		$this->_lastQuery = $query;
		
		if( $row = $this->_database->FetchRow( $query ) )
		{
			foreach( $row as $k=>$v )
			{
				$this->$k = stripslashes( $v );
			}
			if( method_exists( $this, 'OnLoaded' ) ) $this->OnLoaded();
			return true;
		}
		else
		{
			$this->_lastQuery .= '--' . $this->_database->_lastError . '|' . mysqli_error( $this->_database->_link );
		}
		
		return false;
	}
	
	// Save data back into object
	function Save()
	{
		if( !$this->_database )
		{
			$this->_lastError = 'No database connection.';
			return false;
		}
		if( !$this->_primarykeys )
		{
			$this->_lastError = 'No primary key(s).';
			return false;
		}
		// Hook
		if( method_exists( $this, 'OnSave' ) ) $this->OnSave();
		
		// Save mode
		$mode = 0;
		$query = '';
		
		// Check if keys == fields
		if( count( $this->_primarykeys ) == count( $this->_fieldnames ) )
		{
			$mode = 1;
		}
		else
		{
			// Needs all primary keys to update
			foreach( $this->_primarykeys as $k )
			{
				if( $this->$k == null )
				{
					$mode = 1; break;
				}
			}
		}

		// Insert
		if( $mode == 1 )
		{
			$query .= 'INSERT INTO `' . $this->_name . '`( ';
			$filds = array(); $fildz = array();
			foreach( $this->_fieldnames as $f )
			{
				if( in_array( $f, $this->_autofields ) )
					continue;
				$filds[] = "`$f`";
				$fildz[] = $f;
			}
			$query .= implode( ', ', $filds ) . ' ) VALUES( ';
			$vals = array();
			foreach( $fildz as $v )
			{
				$vals[] = $this->EncapsulateField( $v, $this->$v );
			}
			$query .= implode( ', ', $vals ) . ' )';
		}
		else
		{
			$query .= 'UPDATE `' . $this->_name . '`';
			$sets = array();
			foreach( $this->_fieldnames as $f )
			{
				if( in_array( $f, $this->_primarykeys ) )
					continue;
				
				$sets[] = "`$f`=" . $this->EncapsulateField( $f, $this->$f );
			}
			$query .= ' SET ' . implode( ', ', $sets ) . ' WHERE ';
			$ands = array();
			foreach( $this->_primarykeys as $k )
			{
				$ands[] = "`$k`=" . $this->EncapsulateField( $k, $this->$k );
			}
			$query .= implode( ' AND ', $ands );
		}
	
		// Execute
		if( $result = $this->_database->Query( $query ) )
		{
			// Hook
			if( method_exists( $this, 'OnSaved' ) ) $this->OnSaved();
		}
		$this->_lastQuery = $query;
		
		// Update with right ID --------------------------------------------
		if( count( $this->_primarykeys ) == 1 )
		{
			$v = $this->_primarykeys[0];
			$id = $mode == 1 ? $this->GetLastInsertId() : $this->$v;
			$this->$v = $id;
			$this->Load();
		}
		// Support multiple primary keys
		else if( count( $this->_primarykeys ) > 1 )
		{
			$error = false;
			foreach( $this->_primarykeys as $k=>$v )
			{
				if( !isset( $this->$v ) )
				{
					$this->_lastError = 'Failed to run query.';
					$error = true;
				}
			}
			if( !$error )
				$this->Load();
		}
		else $this->_lastError = 'Failed to run query.';
		
		return $result;
	}
	
	// Get an object by single key
	function GetById( $tableName, $singleKey )
	{
		$o = new dbIO( $tableName );
		if( count( $o->_primarykeys ) > 1 )
			return false;
		$o->{$o->_primarykeys[0]} = $singleKey;
		if( $o->Load() )
			return $o;
		return false;
	}
	
	// Get an object by all primary keys
	function GetByIds( $tableName, $keyAr )
	{
		$o = new dbIO( $tableName );
		if( count( $keyAr ) < count( $o->_primarykeys ) )
			return false;
		$i = 0;
		foreach( $o->_primarykeys as $p )
		{
			$o->{$p} = $keyAr[$i++];
		}
		if( $o->Load() )
			return $o;
		return false;
	}
	
	// Delete by primary keys
	function Delete()
	{
		if( !$this->_database || !$this->_primarykeys )
			return;
			
		$wheres = array();
		foreach( $this->_primarykeys as $k )
		{
			$wheres[] = "`$k`=" . $this->EncapsulateField( $k, $this->$k );
		}
		$query = 'DELETE FROM `' . $this->_name . '` WHERE ' . implode( ' AND ', $wheres );
		return $this->_database->Query( $query );
	}
	
	function SetFromArray( $array )
	{
		foreach( $array as $k=>$v )
		{
			$this->$k = $v;
		}
	}
	
	function OrderBy( $field, $mode )
	{
		$this->_orderBy[] = array( $field, $mode );
	}
	
	function Where( $field, $string )
	{
		$this->_where[] = array( $field, $string );
	}
	
	function Limit( $pos, $limit )
	{
		$this->_position = $pos;
		$this->_limit = $limit;
	}
	
	function FindSingle( $query = false )
	{
		// Get only one
		$lim = false;
		$pos = false;
		if( isset( $this->_limit ) )
			$lim = $this->_limit;
		if( isset( $this->_position ) )
			$pos = $this->_position;
		$this->Limit( 0, 1 );
		if( $a = $this->Find( $query ) )
		{
			// Reset
			$this->_limit = $lim;
			$this->_position = $pos;
			// Return result
			return $a[0];
		}
		// Reset
		$this->_limit = $lim;
		$this->_position = $pos;
		return $a;
	}
	
	function Find( $query = false )
	{
		global $Logger;
		if( !is_object( $this->_database ) )
			die( 'Error: no database in object.' );
		if( !$query )
		{
			$wheres = array();
			$orderby = array();
			if( !isset( $this->_fieldnames ) ) return false;
			foreach( $this->_fieldnames as $v )
			{
				if( trim( $v ) && trim( $this->$v ) )
				{
					$wheres[] = "`$v`=" . $this->EncapsulateField( $v, $this->$v );
				}
			}
			if( count( $this->_where ) )
			{
				foreach( $this->_where as $ar )
				{
					if( strstr( $ar[1], '%' ) )
						$wheres[] = "`$ar[0]` LIKE \"$ar[1]\"";
					else $wheres[] = "`$ar[0]`=" . $this->EncapsulateField( $ar[0], $ar[1] );
				}
			}
			if( count( $this->_orderBy ) )
			{
				foreach( $this->_orderBy as $ar )
					$orderby[] = "`$ar[0]` $ar[1]";
			}
			$query = "SELECT * FROM `{$this->_name}`";
			if( count( $wheres ) )
				$query .= "WHERE " . implode( ' AND ', $wheres );
			if( count( $orderby ) )
				$query .= ' ORDER BY ' . implode( ', ', $orderby );
			// Limit syntax
			if(( isset( $this->_limit ) && $this->_limit >= 0 ) ||( isset( $this->_position ) && $this->_position >= 0 ) )
				$query .= ' LIMIT ' .( $this->_position >= 0 ?(string)$this->_position : '0' ) . ',' . 
					( $this->_limit >= 0 ?(string)$this->_limit : '0' );
		}
		$this->_lastQuery = $query;
		if( $objs = $this->_database->FetchObjects( $query ) )
		{
			$res = array();
			foreach( $objs as $o )
			{
				$class = get_class( $this );
				if( $class != 'DbIO' )
					$d = new $class();
				else $d = new DbIO( $this->_name );
				if( method_exists( $d, 'OnLoad' ) )
					$d->OnLoad();
				if( isset( $this->_fieldnames ) )
				{
					foreach( $this->_fieldnames as $v )
						$d->$v = stripslashes( $o->$v );
					if( $class == 'File' )
						$d->GetImageDimensions();
				}
				if( method_exists( $d, 'OnLoaded' ) )
					$d->OnLoaded();
				$res[] = $d;
			}
			return $res;
		}
		return false;
	}
	
	// Set data from an object
	function SetFromObject( $o )
	{
		if( $this->_fieldnames )
		{
			foreach( $this->_fieldnames as $k )
			{
				if( isset( $o->$k ) ) $this->$k = $o->$k;
			}
			return true;
		}
		return false;
	}
}

?>
