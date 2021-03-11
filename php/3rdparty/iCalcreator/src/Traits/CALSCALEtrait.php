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

namespace Kigkonsult\Icalcreator\Traits;

use Kigkonsult\Icalcreator\Util\Util;
use InvalidArgumentException;

use Kigkonsult\Icalcreator\Vcalendar;
use function sprintf;

/**
 * CALSCALE property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.3 - 2019-03-13
 */
trait CALSCALEtrait
{
    /**
     * @var string calendar property CALSCALE
     * @access protected
     */
    protected $calscale = null;

    /**
     * Return formatted output for calendar property calscale
     *
     * @return string
     */
    public function createCalscale() {
        if( empty( $this->calscale )) {
            $this->calscale = Vcalendar::GREGORIAN;
        }
        return sprintf( self::$FMTICAL, self::CALSCALE, $this->calscale );
    }

    /**
     * Delete calendar component property calscale
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteCalscale() {
        $this->calscale = null;
        return true;
    }

    /**
     * Return calscale
     *
     * @return string
     * @since  2.27.1 - 2018-12-15
     */
    public function getCalscale() {
        if( empty( $this->calscale )) {
            $this->calscale = Vcalendar::GREGORIAN;
        }
        return $this->calscale;
    }

    /**
     * Set calendar property calscale
     *
     * @param string $value
     * @return static
     * @throws InvalidArgumentException;
     * @since  2.27.3 - 2018-12-22
     */
    public function setCalscale( $value ) {
        if( empty( $value )) {
            $value = Vcalendar::GREGORIAN;
        }
        $this->calscale = $value;
        return $this;
    }
}
