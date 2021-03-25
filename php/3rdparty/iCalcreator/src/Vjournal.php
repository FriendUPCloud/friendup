<?php
/**
  * iCalcreator, the PHP class package managing iCal (rfc2445/rfc5445) calendar information.
 *
 * copyright (c) 2007-2019 Kjell-Inge Gustafsson, kigkonsult, All rights reserved
 * Link      https://kigkonsult.se
 * Package   iCalcreator
 * Version   2.28
 * License   Subject matter of licence is the software iCalcreator.
 *           The above copyright, link, package and version notices,
 *           this licence notice and the invariant [rfc5545] PRODID result use
 *           as implemented and invoked in iCalcreator shall be included in
 *           all copies or substantial portions of the iCalcreator.
 *
 *           iCalcreator is free software: you can redistribute it and/or modify
 *           it under the terms of the GNU Lesser General Public License as published
 *           by the Free Software Foundation, either version 3 of the License,
 *           or (at your option) any later version.
 *
 *           iCalcreator is distributed in the hope that it will be useful,
 *           but WITHOUT ANY WARRANTY; without even the implied warranty of
 *           MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *           GNU Lesser General Public License for more details.
 *
 *           You should have received a copy of the GNU Lesser General Public License
 *           along with iCalcreator. If not, see <https://www.gnu.org/licenses/>.
 *
 * This file is a part of iCalcreator.
*/

namespace Kigkonsult\Icalcreator;

use Exception;

use function sprintf;
use function strtoupper;

/**
 * iCalcreator VJOURNAL component class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.4 - 2018-12-19
 */
final class Vjournal extends Vcomponent
{
    use Traits\ATTACHtrait,
        Traits\ATTENDEEtrait,
        Traits\CATEGORIEStrait,
        Traits\CLASStrait,
        Traits\COMMENTtrait,
        Traits\CONTACTtrait,
        Traits\CREATEDtrait,
        Traits\DESCRIPTIONtrait,
        Traits\DTSTAMPtrait,
        Traits\DTSTARTtrait,
        Traits\EXDATEtrait,
        Traits\EXRULEtrait,
        Traits\LAST_MODIFIEDtrait,
        Traits\ORGANIZERtrait,
        Traits\RDATEtrait,
        Traits\RECURRENCE_IDtrait,
        Traits\RELATED_TOtrait,
        Traits\REQUEST_STATUStrait,
        Traits\RRULEtrait,
        Traits\SEQUENCEtrait,
        Traits\STATUStrait,
        Traits\SUMMARYtrait,
        Traits\UIDtrait,
        Traits\URLtrait;

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $compSgn = 'j';

    /**
     * Destructor
     *
     * @since  2.26 - 2018-11-10
     */
    public function __destruct() {
        unset(
            $this->compType,
            $this->xprop,
            $this->components,
            $this->unparsed,
            $this->config,
            $this->compix,
            $this->propIx,
            $this->propDelIx
        );
        unset(
            $this->cno,
            $this->srtk
        );
        unset(
            $this->attach,
            $this->attendee,
            $this->categories,
            $this->class,
            $this->comment,
            $this->contact,
            $this->created,
            $this->description,
            $this->dtstamp,
            $this->dtstart,
            $this->exdate,
            $this->exrule,
            $this->lastmodified,
            $this->organizer,
            $this->rdate,
            $this->recurrenceid,
            $this->relatedto,
            $this->requeststatus,
            $this->rrule,
            $this->sequence,
            $this->status,
            $this->summary,
            $this->uid,
            $this->url
        );
    }

    /**
     * Return formatted output for calendar component VJOURNAL object instance
     *
     * @return string
     * @throws Exception  (on Rdate err)
     * @since  2.27.2 - 2018-12-21
     */
    public function createComponent() {
        $compType    = strtoupper( $this->getCompType());
        $component   = sprintf( self::$FMTBEGIN, $compType );
        $component  .= $this->createUid();
        $component  .= $this->createDtstamp();
        $component  .= $this->createAttach();
        $component  .= $this->createAttendee();
        $component  .= $this->createCategories();
        $component  .= $this->createClass();
        $component  .= $this->createComment();
        $component  .= $this->createContact();
        $component  .= $this->createCreated();
        $component  .= $this->createDescription();
        $component  .= $this->createDtstart();
        $component  .= $this->createExdate();
        $component  .= $this->createExrule();
        $component  .= $this->createLastModified();
        $component  .= $this->createOrganizer();
        $component  .= $this->createRdate();
        $component  .= $this->createRequestStatus();
        $component  .= $this->createRecurrenceid();
        $component  .= $this->createRelatedTo();
        $component  .= $this->createRrule();
        $component  .= $this->createSequence();
        $component  .= $this->createStatus();
        $component  .= $this->createSummary();
        $component  .= $this->createUrl();
        $component  .= $this->createXprop();
        return $component . sprintf( self::$FMTEND, $compType );
    }
}
