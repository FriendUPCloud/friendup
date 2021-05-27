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
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\HttpFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

/**
 * TZURL property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait TZURLtrait
{
    /**
     * @var array component property TZURL value
     * @access protected
     */
    protected $tzurl = null;

    /**
     * Return formatted output for calendar component property tzurl
     *
     * @return string
     */
    public function createTzurl() {
        if( empty( $this->tzurl )) {
            return null;
        }
        if( empty( $this->tzurl[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::TZURL ) : null;
        }
        return StringFactory::createElement(
            self::TZURL,
            ParameterFactory::createParams( $this->tzurl[Util::$LCparams] ),
            $this->tzurl[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property tzurl
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteTzurl() {
        $this->tzurl = null;
        return true;
    }

    /**
     * Get calendar component property tzurl
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-13
     */
    public function getTzurl( $inclParam = false ) {
        if( empty( $this->tzurl )) {
            return false;
        }
        return ( $inclParam ) ? $this->tzurl : $this->tzurl[Util::$LCvalue];
    }

    /**
     * Set calendar component property tzurl
     *
     * @param string $value
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     * @todo "TZURL" values SHOULD NOT be specified as a file URI type.
     * This URI form can be useful within an organization, but is problematic
     * in the Internet.
     */
    public function setTzurl( $value = null, $params = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::TZURL );
            $value  = Util::$SP0;
            $params = [];
        }
        else {
            HttpFactory::assertUrl( $value );
        }
        $this->tzurl = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
