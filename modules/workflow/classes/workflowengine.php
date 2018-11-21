<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

 /**
  * The Friend Workflow Engine is a bare bones, but powerful and compact 
  * framework for building workflows on the Friend Platform. It uses DataDrivers
  * to integrate with core Friend components as well as third party components.
  *
  * @author Hogne Titlestad <ht@friendup.cloud>
  *
  * @param object $database A Friend Database object
  * @param string $user     The user object (including level, 'Admin' or 'User')
  *
  * @example examples/example1.php
  * 
  */

class WorkflowEngine
{
	var $database;
	var $user;
	private $functions;
	
	public function WorkflowEngine ( $database, $user )
	{
		$this->database = $database;
		$this->user = $user;
		$this->initializeHashMap();
	}
	
	// Map public command functions
	private function initializeHashMap()
	{
		$this->functions = array(
			'listworkflows'  => 'listWorkflows',
			'checkworkflows' => 'checkWorkflows',
			'addworkflow'    => 'addWorkflow',
			'addprocess'     => 'addProcess',
			'deleteprocess'  => 'deleteProcess',
			'updateprocess'  => 'updateProcess',
			'addpipeline'    => 'addPipeline',
			'help'           => 'help'
		);
	}
	
	// Just display the help for each command...
	public function help( $args )
	{
		// Check help for each function
		foreach( $this->functions as $func )
		{
			if( $func == 'help' ) continue;
			if( isset( $args->$func ) )
			{
				return 'ok<!--separate-->{"message":"Help for ' . $func . ' not available."}';
			}
		}
		return 'ok<!--separate-->{"Commands":["checkworkflows","listworkflows","addworkflow","addprocess","updateprocess","addpipeline"]}';
	}
	
	// Quicker way to execute
	public function executeCommand( $command, $args )
	{
		if( !isset( $command ) || !isset( $this->functions[ $command ] ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Unknown command."}';
		}
		return $this->$command( $args );
	}

	// Just list all workflows
	public function listWorkflows( $args )
	{
		// TODO: Make user version, this one is for admin!
		if( $this->user->UserLevel == 'Admin' )
		{
			if( $records = $this->database->fetchObjects( '
				SELECT * FROM `ProcessWorkflow` w
				WHERE
					( w.DateFrom IS NULL AND w.DateTo IS NULL ) OR
					( w.DateFrom <= NOW() AND w.DateTo >= NOW() )
			' ) )
			{
				$out = new stdClass();
				foreach( $records as $rec )
				{
					$o = new stdClass();
					if( !$rec->DateFrom || !$rec->DateTo )
					{
						$o->Interval = 'Workflow is continuously active.';
					}
					else
					{
						$o->DateFrom = $rec->DateFrom;
						$o->DateTo = $rec->DateTo;
					}
					if( !$o->Workgroup && !$o->UserID )
					{
						$o->{"Valid for"} = 'Valid for all users.';
					}
					else
					{
						$o->Workgroup = $rec->Workgroup;
					}
					$out->{$rec->Name} = $o;
				}
				return 'ok<!--separate-->' . json_encode( $out );
			}
		}
		// List for user!
		else
		{
			return 'ok<!--separate-->[]';
		}
		// Nothing to list!
		return 'fail<!--separate-->[]';
	}

	public function addWorkflow( $args )
	{
		if( $this->user->UserLevel != 'Admin' ) return 'fail<!--separate-->{"response":-1,"message":"Access denied."}';
		
		$f = new dbIO( 'ProcessWorkflow' );
		
		$name = isset( $args->name ) ? $args->name : '';
		if( !trim( $name ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Failed to add workflow. Please supply an alphanumerical worlflow name."}';
		}
		
		$workgroup = isset( $args->workgroup ) ? $args->workgroup : false;
		$datefrom = isset( $args->datefrom ) ? $args->datefrom : false;
		$dateto = isset( $args->dateto ) ? $args->dateto : false;
		
		$f->Name = trim( $name );
		
		// Test if it already exists!
		if( $f->Load() )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Failed to add workflow. It already exists."}';
		}
		
		// Optional fields
		if( $workgroup )
			$f->Workgroup = trim( $workgroup );
		else $f->Workgroup = '';
		if( $datefrom )
			$f->DateFrom = trim( $datefrom );
		else $f->DateFrom = '1970-01-01 00:00:00';
		if( $dateto )
			$f->DateTo = trim( $dateto );
		else $f->DateTo = '5313-01-28 03:30:00';
		
		$f->Save();
		
		if( $f->ID > 0 )
		{
			return 'ok<!--separate-->{"response":1,"message":"Added workflow \'' . $name . '\' to Friend Core."}';
		}
		return 'fail<!--separate-->{"response":-1,"message":"Failed to add workflow \'' . $name . '\'."}';
	}
	
	// Checks all workflows
	public function checkWorkflows( $args )
	{
		$count = false;
		
		// Grab current workflows
		if( $records = $this->database->fetchObjects( '
			SELECT * FROM `ProcessWorkflow` w
			WHERE
				( w.DateFrom IS NULL AND w.DataTo IS NULL ) OR
				( w.DateFrom <= NOW() AND w.DateTo >= NOW() )
		' ) )
		{
			$processCount = 0;
			foreach( $records as $record )
			{
				if( $processes = CheckProcesses( $record ) )
				{
					$processCount++;
				}
			}
			$count = $processCount > 0 ? $processCount : false;
		}
		
		if( $count === false )
		{
			return 'fail<!--separate-->{"response":-1,"message":"No workflows executed."}';
		}
		return 'ok<!--separate-->{"response":1,"message":"Executed workflows.","count":' . $count . '}';
	}

	public function updateProcess( $args )
	{
		if( !isset( $args->workflow ) || !isset( $args->label ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Usage: Workflow.module updateprocess workflow={workflowname|workflowid} label={processlabel}"}';
		}
	
		$p = new dbIO( 'ProcessNode' );
		$w = new dbIO( 'ProcessWorkflow' );

		// Name
		if( !intval( $args->workflow, 10 ) )
		{
			$w->Name = trim( $args->workflow );
			if( !$w->Load() )
			{
				return 'fail<!--separate-->{"response":-1,"message":"Could not find workflow."}';
			}
			$p->WorkflowID = $w->ID;
		}
		// It's an id!
		else
		{
			$w->ID = $args->workflow;
			if( !$w->Load() )
			{
				return 'fail<!--separate-->{"response":-1,"message":"Could not find workflow by ID."}';
			}
			$p->WorkflowID = $w->ID;
		}
	
		$p->Label = $args->label;
	
		if( !$p->Load() )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Process does not exist in \'' . $w->Name . '\'."}';
		}
	
		$updates = array(
			 'newtitle'=>'Title', 'newdatadriver'=>'DataDriver', 'newdata'=>'Data'
		);
	
		if( isset( $args->newlabel ) )
		{
			$n = new dbIO( 'ProcessNode' );
			$n->WorkflowID = $w->ID;
			$n->Label = $args->newlabel;
			if( $n->Load() )
			{
				return 'fail<!--separate-->{"response":-1,"message":"Process with name \'' . $n->Label . '\' already exists in \'' . $w->Name . '\'."}';
			}
			$p->Label = $n->Label;
		}
	
		// TODO: Check if datadriver exists!
		foreach( $updates as $update=>$v )
		{
			if( isset( $args->$update ) )
			{
				$p->$v = $args->$update;
			}
		}
	
		if( !$p->Save() )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Could not update process \'' . $p->Label . '\' in \'' . $w->Name . '\'."}';
		}
	
		// Success!
		return 'fail<!--separate-->{"response":-1,"message":"Process updated in \'' . $w->Name . '\'."}';
	}

	// Adds a workflow process to a workflow
	public function addProcess( $args )
	{
		if( !isset( $args->workflow ) || !isset( $args->label ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Usage: Workflow.module addprocess workflow={workflowname|workflowid} label={processlabel}"}';
		}
	
		$p = new dbIO( 'ProcessNode' );
		$w = new dbIO( 'ProcessWorkflow' );

		// Name
		if( !intval( $args->workflow, 10 ) )
		{
			$w->Name = trim( $args->workflow );
			if( !$w->Load() )
			{
				return 'fail<!--separate-->{"response":-1,"message":"Could not find workflow."}';
			}
			$p->WorkflowID = $w->ID;
		}
		// It's an id!
		else
		{
			$w->ID = $args->workflow;
			if( !$w->Load() )
			{
				return 'fail<!--separate-->{"response":-1,"message":"Could not find workflow by ID."}';
			}
			$p->WorkflowID = $w->ID;
		}
	
		$p->Label = $args->label;
	
		if( $p->Load() )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Process already exists in workflow \'' . $w->Name . '\'."}';
		}
	
		if( isset( $args->title ) )
		{
			$p->Title = $args->title;
		}
		if( isset( $args->datadriver ) )
		{
			// TODO: Check if the data driver exists!
			$p->DataDriver = $args->datadriver;
		}
		if( isset( $args->data ) )
		{
			$p->Data = $args->data;
		}
	
		if( $p->Save() )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Process saved into workflow \'' . $w->Name . '\'."}';
		}
	
		return 'fail<!--separate-->{"response":-1,"message":"Could not save process."}';
	}

	public function deleteProcess( $args )
	{
		if( !isset( $args->workflow ) || !isset( $args->label ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Usage: Workflow.module deleteprocess {workflowname|workflowid} {processlabel}"}';
		}
		$o = new dbIO( 'ProcessNode' );
	
	
	}

	// Adds a pipeline
	public function addPipeline( $args )
	{
		$p = new dbIO( 'WorkflowPipeline' );
	
		if( !isset( $args->workflow ) || !isset( $args->label ) )
		{
			return 'fail<!--separate-->{"response":-1,"message":"Usage: Workflow.module addpipeline workflow={workflowname|workflowid} label={processlabel}"}';
		}
	
		return 'fail<!--separate-->{"response":-1,"message":"Unfinished feature."}'; 
	}


	// Checks a workflow for active pipelines
	public function checkProcesses( $args )
	{
		$workflow = $args->workflow;
		
		if( $processes = $this->database->fetchObjects( '
			SELECT n.* FROM `ProcessPipeline` p, `ProcessNode` n
			WHERE
					p.ProcessID = n.ID
				AND n.WorkflowID = \'' . $workflow->ID . '\'
		' ) )
		{
			foreach( $processes as $process )
			{
				// Can we evaluate the current process node in pipeline?
				if( $result = EvaluateCurrentProcess( $workflow, $process ) )
				{
					// Do some kind of notification?
				}
				else
				{
					// Some other notification?
				}
			}
		}
		// No pipeline for this workflow?
		else
		{
			StartWorkflowPipeline( $workflow->ID, $workflow->Workgroup, false );
		}
	}

	public function evaluateCurrentProcess( $args )
	{
		$workflow = $args->workflow; $process = $args->process;
		
		$result = false;
	
		$pipelineProcess = new dbIO( 'ProcessPipeline' );
		$pipelineProcess->ProcessID = $process->ID;
	
		// Can we load a pipeline object?
		if( !$pipelineProcess->Load() )
		{
			return false;
		}
	
		if( $pipelineProcess->DataDriver )
		{
			$result = $this->executeDataDriver( $process, $pipelineProcess->DataDriver );
		
			// Evaluate data driver result
		
			// We got a positive return value
			if( $result->returnValue === true )
			{
				// Complete current pipeline process
				$pipelineProcess->Date = date( 'Y-m-d H:i:s' );
				$pipelineProcess->Save();
			
				// Save process pipeline node
				$p = new dbIO( 'ProcessPipeline' );
				$p->ProcessID = $process->ProcessNodeTrue;
				$p->PreviousProcessID = $process->ID;
				$p->Workgroup = $pipelineProcess->Workgroup;
				$p->UserID = $pipelineProcess->UserID;
				if( $p->Save() )
				{
					$result = true;
				}
			}
			// We got a negative returnvalue
			else if( $result->returnValue === false )
			{
				// Save process pipeline node
				$p = new dbIO( 'ProcessPipeline' );
				$p->ProcessID = $process->ProcessNodeFalse;
				$p->PreviousProcessID = $process->ID;
				$p->Workgroup = $pipelineProcess->Workgroup;
				$p->UserID = $pipelineProcess->UserID;
				if( $p->Save() )
				{
					$result = true;
				}
			}
			// We got a label return value
			else if( strlen( $result->returnValue ) > 0 )
			{
				// Load process node by label
				$n = new dbIO( 'ProcessNode' );
				$n->WorkflowID = $process->WorkflowID;
				$n->Label = $result->returnValue;
				if( $n->Load() )
				{
					// Save process pipeline node
					$p = new dbIO( 'ProcessPipeline' );
					$p->ProcessID = $n->ID;
					$p->PreviousProcessID = $process->ID;
					$p->Workgroup = $pipelineProcess->Workgroup;
					$p->UserID = $pipelineProcess->UserID;
					if( $p->Save() )
					{
						$result = true;
					}
				}
			}
		}
		// Other unknown stuff (built-in functionality)
		else
		{
			// Probably nothing here
		}
	
		// End of pipeline - finish it up!
		if( !$result )
		{
			// It's a tail!
			// Save process pipeline node as end node
			$p = new dbIO( 'ProcessPipeline' );
			$p->PreviousProcessID = $process->ID;
			$p->ProcessID = 0;
			$p->Workgroup = $pipelineProcess->Workgroup;
			$p->UserID = $pipelineProcess->UserID;
			$p->Date = date( 'Y-m-d H:i:s' );
			$p->End = true;
			$p->Save();
		}
	
		return $result;
	}

	// Execute a datadriver
	private function executeDataDriver( $args )
	{
		$process = $args->process; $datadriver = $args->process;
		
		$dfolder = 'modules/workflow/datadrivers/' . $datadriver;
		if( file_exists( $dfolder ) && is_dir( $dfolder ) )
		{
			if( file_exists( $dfolder . '/driver.php' ) )
			{
				$data = null;
				require( $dfolder . '/driver.php' );
				$driver = new DataDriver( $process );
				if( $data = $driver->process() )
				{
					return $data;
				}
			}
		}
		return false;
	}

	// Starts a process pipeline
	public function startWorkflowPipeline( $args )
	{
		$workflow = $args->workflow; 
		$workgroup = isset( $args->workgroup ) ? $args->workgroup : false;
		$user = isset( $args->user ) ? $args->user : false;
		
		// Load head
		$n = new dbIO( 'ProcessNode' );
		$n->Label = 'head';
		$n->WorkflowID = $workflow->ID;
		if( $n->Load() )
		{
			// Save process pipeline node as end node
			$p = new dbIO( 'ProcessPipeline' );
			$p->PreviousProcessID = 0;
			$p->ProcessID = $n->ID;
			$p->Workgroup = $workgroup ? $workgroup : '';
			$p->UserID = $user ? $user : '';
			$p->Date = '';
			$p->End = false;
			if( $p->Save() )
			{
				return true;
			}
		}
		return false;
	}
}
?>
