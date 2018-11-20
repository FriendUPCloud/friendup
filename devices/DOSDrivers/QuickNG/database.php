<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class DBhandler
{
	var $type = 'mysql';
	
	/**
	 * @brief Constructor that connects to the database
	**/
	function DBhandler( $hostname = false, $username = false, $password = false, $database = false, $type = false )
	{
		$hostname   = ( $hostname ? $hostname : DATABASE_HOST );
		$username   = ( $username ? $username : DATABASE_USERNAME );
		$password   = ( $password ? $password : DATABASE_PASSWORD );
		$database   = ( $database ? $database : DATABASE_NAME );
		$this->type = ( $type ? $type : DATABASE_TYPE );
		
		$this->DatabaseConnect( $hostname, $username, $password, $database );
	}
	
	function DatabaseConnect ( $hostname, $username, $password, $database )
	{
		switch( $this->type )
		{
			case 'sybase':
				
				$this->resource = sybase_connect( $hostname, $username, $password, 'ISO-8859-1' );
				
				if( !$this->resource ) 
				{ 
					die( 'Couldn\'t make a connection!' ); 
				}
				
				if( $this->resource )
				{
					sybase_select_db( $database, $this->resource );
				}
				
				break;
			
			default:
			
				$this->resource = mysql_connect( $hostname, $username, $password, true );
		
				if( $this->resource )
				{
					mysql_select_db( $database, $this->resource );
				}
				
				break;
		}
	}
	
	function DatabaseQuery ( $query )
	{
		switch( $this->type )
		{
			case 'sybase':
				
				if ( $query && $this->resource && ( $result = sybase_query( $query, $this->resource ) ) )
				{
					return $result;
				}
				
				break;
			
			default:
				
				if ( $query && $this->resource && ( $result = mysql_query( $query, $this->resource ) ) )
				{
					return $result;
				}
				
				break;	
		}
		
		return false;
	}
	
	function DatabaseObjects ( $query )
	{
		switch( $this->type )
		{
			case 'sybase':
				
				if ( $query && $this->resource && ( $result = sybase_query( $query, $this->resource ) ) )
				{
					while ( $rows[] = sybase_fetch_assoc ( $result ) ) {}
			
					array_pop ( $rows );
			
					if ( ( $count = count ( $rows ) ) )
					{
						$output = Array ( );
				
						foreach ( $rows as $row )
						{
							$obj = new stdclass ( );
					
							foreach ( $row as $k=>$v )
							{
								if ( is_string ( $v ) || is_numeric ( $v ) )
								{
									$obj->$k = $v;
								}
							}
					
							$output[] = $obj;
						}
				
						sybase_free_result ( $result );
				
						return $output;
					}
				}
				
				break;
				
			default:
				
				if ( $query && $this->resource && ( $result = mysql_query( $query, $this->resource ) ) )
				{
					while ( $rows[] = mysql_fetch_assoc ( $result ) ) {}
			
					array_pop ( $rows );
			
					if ( ( $count = count ( $rows ) ) )
					{
						$output = Array ( );
				
						foreach ( $rows as $row )
						{
							$obj = new stdclass ( );
					
							foreach ( $row as $k=>$v )
							{
								if ( is_string ( $v ) || is_numeric ( $v ) )
								{
									$obj->$k = $v;
								}
							}
					
							$output[] = $obj;
						}
				
						mysql_free_result ( $result );
				
						return $output;
					}
				}
			
				break;
		}
		
		return false;
	}
	
	function DatabaseFields ( $table )
	{
		$fields = false;
		
		switch( $this->type )
		{
			case 'sybase':
				
				if ( $this->resource && ( $fields_res = sybase_query( "DESCRIBE `{$table}`", $this->resource ) ) )
				{
					$fields = array ();
			
					if ( sybase_num_rows( $fields_res ) > 0 ) 
					{
						while ( $row = sybase_fetch_object( $fields_res ) )
						{
							$fields[$row->Field] = $row;
						}
					}
				}
			
				break;
				
			default:
				
				if ( $this->resource && ( $fields_res = mysql_query( "DESCRIBE `{$table}`", $this->resource ) ) )
				{
					$fields = array ();
			
					if ( mysql_num_rows( $fields_res ) > 0 ) 
					{
						while ( $row = mysql_fetch_object( $fields_res ) )
						{
							$fields[$row->Field] = $row;
						}
					}
				}
			
				break;
		}
		
		return $fields;
	}
	
}

?>
