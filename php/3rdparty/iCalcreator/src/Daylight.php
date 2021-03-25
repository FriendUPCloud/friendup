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
 * iCalcreator (Vtimezone) Daylight component class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.6 - 2018-12-28
 */
final class Daylight extends CalendarComponent
{
    use Traits\COMMENTtrait,
        Traits\DTSTARTtrait,
        Traits\RDATEtrait,
        Traits\RRULEtrait,
        Traits\TZNAMEtrait,
        Traits\TZOFFSETFROMtrait,
        Traits\TZOFFSETTOtrait;

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $compSgn = 'd';

    /**
     * Destructor
     *
     * @since  2.27.6 - 2018-12-28
     */
    public function __destruct() {
        unset(
            $this->compType,
            $this->xprop,
            $this->components,
            $this->unparsed,
            $this->config,
            $this->propIx,
            $this->compix,
            $this->propDelIx
        );
        unset(
            $this->cno,
            $this->srtk
        );
        unset(
            $this->comment,
            $this->dtstart,
            $this->rdate,
            $this->rrule,
            $this->tzname,
            $this->tzoffsetfrom,
            $this->tzoffsetto
        );
    }

    /**
     * Return formatted output for calendar component VTIMEZONE Daylight object instance
     *
     * @return string
     * @throws Exception  (on Rdate err)
     * @since  2.27.6 - 2018-12-28
     */
    public function createComponent() {
        $compType    = strtoupper( $this->getCompType());
        $component   = sprintf( self::$FMTBEGIN, $compType );
        $component  .= $this->createTzname();
        $component  .= $this->createDtstart();
        $component  .= $this->createTzoffsetfrom();
        $component  .= $this->createTzoffsetto();
        $component  .= $this->createRdate();
        $component  .= $this->createRrule();
        $component  .= $this->createComment();
        $component  .= $this->createXprop();
        return $component . sprintf( self::$FMTEND, $compType );
    }

}
