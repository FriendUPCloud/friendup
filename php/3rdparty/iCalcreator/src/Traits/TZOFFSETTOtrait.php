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

use Kigkonsult\Icalcreator\Util\DateTimeZoneFactory;
use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use Kigkonsult\Icalcreator\Vcalendar;
use InvalidArgumentException;

use sprintf;

/**
 * TZOFFSETTO property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait TZOFFSETTOtrait
{
    /**
     * @var array component property TZOFFSETTO value
     * @access protected
     */
    protected $tzoffsetto = null;

    /**
     * Return formatted output for calendar component property tzoffsetto
     *
     * @return string
     */
    public function createTzoffsetto() {
        if( empty( $this->tzoffsetto )) {
            return null;
        }
        if( empty( $this->tzoffsetto[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::TZOFFSETTO ) : null;
        }
        return StringFactory::createElement(
            self::TZOFFSETTO,
            ParameterFactory::createParams( $this->tzoffsetto[Util::$LCparams] ),
            $this->tzoffsetto[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property tzoffsetto
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteTzoffsetto() {
        $this->tzoffsetto = null;
        return true;
    }

    /**
     * Get calendar component property tzoffsetto
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-13
     */
    public function getTzoffsetto( $inclParam = false ) {
        if( empty( $this->tzoffsetto )) {
            return false;
        }
        return ( $inclParam ) ? $this->tzoffsetto : $this->tzoffsetto[Util::$LCvalue];
    }

    /**
     * Set calendar component property tzoffsetto
     *
     * @param string $value
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2019-03-14
     */
    public function setTzoffsetto( $value = null, $params = null ) {
        static $ERR = 'Invalid %s offset value %s';
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::TZOFFSETTO );
            $value  = Util::$SP0;
            $params = [];
        }
        elseif( ! DateTimeZoneFactory::hasOffset( $value )) {
            throw new InvalidArgumentException( sprintf( $ERR, Vcalendar::TZOFFSETTO, $value ));
        }
        $this->tzoffsetto = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
