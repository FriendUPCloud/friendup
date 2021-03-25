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
 * iCalcreator VALARM component class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.4 - 2018-12-19
 */
final class Valarm extends CalendarComponent
{
    use Traits\ACTIONtrait,
        Traits\ATTACHtrait,
        Traits\ATTENDEEtrait,
        Traits\DESCRIPTIONtrait,
        Traits\DURATIONtrait,
        Traits\REPEATtrait,
        Traits\SUMMARYtrait,
        Traits\TRIGGERtrait;

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $compSgn = 'a';

    /**
     * Destructor
     *
     * @since  2.27.3 - 2018-12-28
     */
    public function __destruct() {
        unset(
            $this->compType,
            $this->xprop,
            $this->components,
            $this->unparsed,
            $this->config,
            $this->propIx,
            $this->propDelIx
        );
        unset(
            $this->cno,
            $this->srtk
        );
        unset(
            $this->action,
            $this->attach,
            $this->attendee,
            $this->description,
            $this->duration,
            $this->repeat,
            $this->summary,
            $this->trigger
        );
    }

    /**
     * Return formatted output for calendar component VALARM object instance
     *
     * @return string
     * @throws Exception  (on Duration/Trigger err)
     * @since  2.26 - 2018-11-10
     */
    public function createComponent() {
        $compType    = strtoupper( $this->getCompType());
        $component   = sprintf( self::$FMTBEGIN, $compType );
        $component  .= $this->createAction();
        $component  .= $this->createAttach();
        $component  .= $this->createAttendee();
        $component  .= $this->createDescription();
        $component  .= $this->createDuration();
        $component  .= $this->createRepeat();
        $component  .= $this->createSummary();
        $component  .= $this->createTrigger();
        $component  .= $this->createXprop();
        return $component . sprintf( self::$FMTEND, $compType );
    }

}
