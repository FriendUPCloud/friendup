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

use function implode;
use function is_array;

/**
 * RESOURCES property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait RESOURCEStrait
{
    /**
     * @var array component property RESOURCES value
     * @access protected
     */
    protected $resources = null;

    /**
     * Return formatted output for calendar component property resources
     *
     * @return string
     */
    public function createResources() {
        if( empty( $this->resources )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->resources as $rx => $resource ) {
            if( empty( $resource[Util::$LCvalue] )) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( self::RESOURCES );
                }
                continue;
            }
            if( is_array( $resource[Util::$LCvalue] )) {
                foreach( $resource[Util::$LCvalue] as $rix => $rValue ) {
                    $resource[Util::$LCvalue][$rix] = StringFactory::strrep( $rValue );
                }
                $content = implode( Util::$COMMA, $resource[Util::$LCvalue] );
            }
            else {
                $content = StringFactory::strrep( $resource[Util::$LCvalue] );
            }
            $output .= StringFactory::createElement(
                self::RESOURCES,
                ParameterFactory::createParams( $resource[Util::$LCparams], self::$ALTRPLANGARR, $lang ),
                $content
            );
        }
        return $output;
    }

    /**
     * Delete calendar component property resources
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteResources( $propDelIx = null ) {
        if( empty( $this->resources )) {
            unset( $this->propDelIx[self::RESOURCES] );
            return false;
        }
        return $this->deletePropertyM( $this->resources, self::RESOURCES, $propDelIx );
    }

    /**
     * Get calendar component property resources
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getResources( $propIx = null, $inclParam = false ) {
        if( empty( $this->resources )) {
            unset( $this->propIx[self::RESOURCES] );
            return false;
        }
        return $this->getPropertyM( $this->resources, self::RESOURCES, $propIx, $inclParam );
    }

    /**
     * Set calendar component property resources
     *
     * @param mixed   $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setResources( $value = null, $params = null, $index = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::RESOURCES );
            $value  = Util::$SP0;
            $params = [];
        }
        if( is_array( $value )) {
            foreach( $value as & $valuePart ) {
                $valuePart = StringFactory::trimTrailNL( $valuePart );
            }
        }
        else {
            $value = StringFactory::trimTrailNL( $value );
        }
        $this->setMval( $this->resources, $value, $params, null, $index );
        return $this;
    }
}
