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

use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Vcalendar;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

use function array_change_key_case;
use function is_array;

/**
 * LAST-MODIFIED property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.14 2019-01-28
 */
trait LAST_MODIFIEDtrait
{
    /**
     * @var array component property LAST-MODIFIED value
     * @access protected
     */
    protected $lastmodified = null;

    /**
     * Return formatted output for calendar component property last-modified
     *
     * @return string
     * @since  2.27.14 - 2019-01-26
     */
    public function createLastModified() {
        if( empty( $this->lastmodified )) {
            return null;
        }
        return StringFactory::createElement(
            self::LAST_MODIFIED,
            ParameterFactory::createParams( $this->lastmodified[Util::$LCparams] ),
            DateTimeFactory::dateArrayToStr( $this->lastmodified[Util::$LCvalue] )
        );
    }

    /**
     * Delete calendar component property lastmodified
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteLastmodified() {
        $this->lastmodified = null;
        return true;
    }

    /**
     * Get calendar component property last-modified
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getLastModified( $inclParam = false ) {
        if( empty( $this->lastmodified )) {
            return false;
        }
        return ( $inclParam ) ? $this->lastmodified : $this->lastmodified[Util::$LCvalue];
    }

    /**
     * Set calendar component property last-modified
     *
     * @param mixed  $value
     * @param mixed  $month
     * @param int    $day
     * @param int    $hour
     * @param int    $min
     * @param int    $sec
     * @param string $tz
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.14 2019-02-10
     */
    public function setLastModified(
        $value  = null,
        $month  = null,
        $day    = null,
        $hour   = null,
        $min    = null,
        $sec    = null,
        $tz     = null,
        $params = null
    ) {
        if( empty( $value )) {
            $this->lastmodified = [
                Util::$LCvalue  => DateTimeFactory::getCurrDateArr(),
                Util::$LCparams => [],
            ];
            return $this;
        }
        if( DateTimeFactory::isArgsDate( $value, $month, $day )) {
            $value = DateTimeFactory::argsToStr( $value, $month, $day, $hour, $min, $sec, $tz );
            if( is_array( $params )) {
                $month = $params;
            }
            else {
                $month = ( is_array( $hour )) ? $hour : [];
            }
        }
        elseif( ! is_array( $month )) {
            $month = [];
        }
        $month[Vcalendar::VALUE] = Vcalendar::DATE_TIME;
        $this->lastmodified = DateTimeFactory::setDate(
            $value,
            array_change_key_case( $month, CASE_UPPER ),
            true // $forceUTC
        );
        return $this;
    }
}
