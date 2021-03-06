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
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

/**
 * SUMMARY property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait SUMMARYtrait
{
    /**
     * @var array component property SUMMARY value
     * @access protected
     */
    protected $summary = null;

    /**
     * Return formatted output for calendar component property summary
     *
     * @return string
     */
    public function createSummary() {
        if( empty( $this->summary )) {
            return null;
        }
        if( empty( $this->summary[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::SUMMARY ) : null;
        }
        return StringFactory::createElement(
            self::SUMMARY,
            ParameterFactory::createParams(
                $this->summary[Util::$LCparams],
                self::$ALTRPLANGARR,
                $this->getConfig( self::LANGUAGE )
            ),
            StringFactory::strrep( $this->summary[Util::$LCvalue] )
        );
    }

    /**
     * Delete calendar component property summary
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteSummary() {
        $this->summary = null;
        return true;
    }

    /**
     * Get calendar component property summary
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getSummary( $inclParam = false ) {
        if( empty( $this->summary )) {
            return false;
        }
        return ( $inclParam ) ? $this->summary : $this->summary[Util::$LCvalue];
    }

    /**
     * Set calendar component property summary
     *
     * @param string $value
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setSummary( $value = null, $params = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::SUMMARY );
            $value  = Util::$SP0;
            $params = [];
        }
        $this->summary = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
