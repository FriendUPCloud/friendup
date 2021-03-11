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

use InvalidArgumentException;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\DateTimeZoneFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Vcalendar;

use function is_array;

/**
 * DTSTART property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.14 - 2019-01-26
 */
trait DTSTARTtrait
{
    /**
     * @var array component property DTSTART value
     * @access protected
     */
    protected $dtstart = null;

    /**
     * Return formatted output for calendar component property dtstart
     *
     * @return string
     * @since  2.27.14 - 2019-01-26
     */
    public function createDtstart() {
        if( empty( $this->dtstart )) {
            return null;
        }
        if( DateTimeFactory::hasNoDate( $this->dtstart )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::DTSTART ) : null;
        }
        return StringFactory::createElement(
            self::DTSTART,
            ParameterFactory::createParams( $this->dtstart[Util::$LCparams] ),
            DateTimeFactory::dateArrayToStr(
                $this->dtstart[Util::$LCvalue],
                ParameterFactory::isParamsValueSet( $this->dtstart, self::DATE )
            )
        );
    }

    /**
     * Delete calendar component property dtstart
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteDtstart() {
        $this->dtstart = null;
        return true;
    }

    /**
     * Get calendar component property dtstart
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getDtstart( $inclParam = false ) {
        if( empty( $this->dtstart )) {
            return false;
        }
        return ( $inclParam ) ? $this->dtstart : $this->dtstart[Util::$LCvalue];
    }

    /**
     * Get calendar component property dtstart params
     *
     * @return array
     * @access private
     * @since  2.27.14 - 2019-02-10
     */
    private function getDtstartParams() {
        $output = ( empty( $this->dtstart )) ? [] : $this->dtstart[Util::$LCparams];
        if( isset( $this->dtstart[Util::$LCvalue][Util::$LCtz] ) &&
            DateTimeZoneFactory::isUTCtimeZone( $this->dtstart[Util::$LCvalue][Util::$LCtz] )) {
            $output[Vcalendar::TZID] = DateTimeZoneFactory::$UTCARR[1];
        }
        if( Util::isCompInList( $this->getCompType(), self::$TZCOMPS )) {
            $output[Vcalendar::TZID] = DateTimeZoneFactory::$UTCARR[1];
        }
        return $output;
    }

    /**
     * Set calendar component property dtstart
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
     * @since 2.27.14 2019-01-28
     */
    public function setDtstart(
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
            $this->assertEmptyValue( $value, self::DTSTART );
            $this->dtstart = [
                Util::$LCvalue  => Util::$SP0,
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
        $compType  = $this->getCompType();
        $localTime = Util::isCompInList( $compType, self::$TZCOMPS );
        if( $localTime ) {
            $month[Vcalendar::VALUE] = Vcalendar::DATE_TIME;
        }
        $this->dtstart = DateTimeFactory::setDate(
            $value,
            ParameterFactory::setParams( $month, DateTimeFactory::$DEFAULTVALUEDATETIME ),
            ( Vcalendar::VFREEBUSY == $this->getCompType()), // $forceUTC
            $localTime
        );
        return $this;
    }
}
