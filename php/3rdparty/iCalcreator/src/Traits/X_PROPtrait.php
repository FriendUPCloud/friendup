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

use function count;
use function implode;
use function is_array;
use function is_numeric;
use function sprintf;
use function strtoupper;

/**
 * X-property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait X_PROPtrait
{
    /**
     * @var array component property X-property value
     * @access protected
     */
    protected $xprop = null;

    /**
     * Return formatted output for calendar/component property x-prop
     *
     * @return string
     */
    public function createXprop() {
        if( empty( $this->xprop ) || ! is_array( $this->xprop )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->xprop as $xpropName => $xpropPart ) {
            if( ! isset( $xpropPart[Util::$LCvalue] ) ||
                ( empty( $xpropPart[Util::$LCvalue] ) && ! is_numeric( $xpropPart[Util::$LCvalue] ))) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( $xpropName );
                }
                continue;
            }
            if( is_array( $xpropPart[Util::$LCvalue] )) {
                foreach( $xpropPart[Util::$LCvalue] as $pix => $theXpart ) {
                    $xpropPart[Util::$LCvalue][$pix] = StringFactory::strrep( $theXpart );
                }
                $xpropPart[Util::$LCvalue] = implode( Util::$COMMA, $xpropPart[Util::$LCvalue] );
            }
            else {
                $xpropPart[Util::$LCvalue] = StringFactory::strrep( $xpropPart[Util::$LCvalue] );
            }
            $output .= StringFactory::createElement(
                $xpropName,
                ParameterFactory::createParams( $xpropPart[Util::$LCparams], [ self::LANGUAGE ], $lang ),
                StringFactory::trimTrailNL( $xpropPart[Util::$LCvalue] )
            );
        }
        return $output;
    }

    /**
     * Delete component property X-prop value
     *
     * @param string $propName
     * @param int    $propDelIx removal counter
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteXprop( $propName, $propDelIx=null ) {
        $propName = ( $propName ) ? strtoupper( $propName ) : self::X_PROP;
        if( empty( $this->xprop )) {
            foreach( $this->propDelIx as $propName => $v ) {
                if( StringFactory::isXprefixed( $propName )) {
                    unset( $this->propDelIx[$propName] );
                }
            }
            return false;
        }
        if( is_null( $propDelIx )) {
            $propDelIx = ( isset( $this->propDelIx[$propName] ) && ( self::X_PROP != $propName ))
                ? $this->propDelIx[$propName] + 2 : 1;
        }
        $this->propDelIx[$propName] = --$propDelIx;
        $reduced = [];
        if( $propName != self::X_PROP ) {
            if( ! isset( $this->xprop[$propName] )) {
                unset( $this->propDelIx[$propName] );
                return false;
            }
            foreach( $this->xprop as $k => $xValue ) {
                if(( $k != $propName ) && ! empty( $xValue )) {
                    $reduced[$k] = $xValue;
                }
            }
        }
        else {
            if( count( $this->xprop ) <= $propDelIx ) {
                unset( $this->propDelIx[$propName] );
                return false;
            }
            $xpropNo = 0;
            foreach( $this->xprop as $xpropKey => $xpropValue ) {
                if( $propDelIx != $xpropNo ) {
                    $reduced[$xpropKey] = $xpropValue;
                }
                $xpropNo++;
            }
        }
        $this->xprop = $reduced;
        if( empty( $this->xprop )) {
            $this->xprop = null;
            unset( $this->propDelIx[$propName] );
            return false;
        }
        return true;
    }

    /**
     * Get calendar component property x-prop
     *
     * @param string $propName
     * @param int    $propIx    specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.11 - 2019-01-02
     */
    public function getXprop( $propName = null, $propIx = null, $inclParam = false ) {
        if( empty( $this->xprop )) {
            foreach( $this->propIx as $propName => $v ) {
                if( StringFactory::isXprefixed( $propName )) {
                    unset( $this->propIx[$propName] );
                }
            }
            return false;
        }
        $propName = ( $propName ) ? strtoupper( $propName ) : self::X_PROP;
        if( $propName != self::X_PROP ) {
            if( ! isset( $this->xprop[$propName] )) {
                return false;
            }
            return ( $inclParam )
                ? [ $propName, $this->xprop[$propName], ]
                : [ $propName, $this->xprop[$propName][Util::$LCvalue], ];
        }
        if( empty( $propIx )) {
            $propIx = ( isset( $this->propIx[$propName] )) ? $this->propIx[$propName] + 2 : 1;
        }
        $this->propIx[$propName] = --$propIx;
        $class = get_class();
        $class::recountMvalPropix( $this->xprop, $propIx );
        $this->propIx[$propName] = $propIx;
        $xpropNo = 0;
        foreach( $this->xprop as $xpropKey => $xpropValue ) {
            if( $propIx == $xpropNo ) {
                return ( $inclParam )
                    ? [ $xpropKey, $this->xprop[$xpropKey], ]
                    : [ $xpropKey, $this->xprop[$xpropKey][Util::$LCvalue], ];
            }
            else {
                $xpropNo++;
            }
        }
        return false; // not found ??
    }

    /**
     * Set calendar property x-prop
     *
     * @param string $xpropName
     * @param string $value
     * @param array  $params   optional
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setXprop( $xpropName, $value=null, $params = null ) {
        static $MSG = 'Invalid X-property name : \'%s\'';
        if( empty( $xpropName ) || ! StringFactory::isXprefixed( $xpropName )) {
            throw new InvalidArgumentException( sprintf( $MSG, $xpropName ));
        }
        if( empty( $value )) {
            $this->assertEmptyValue( $value, $xpropName );
            $value  = Util::$SP0;
            $params = [];
        }
        $xprop = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params )
        ];
        if( ! is_array( $this->xprop )) {
            $this->xprop = [];
        }
        $this->xprop[strtoupper( $xpropName )] = $xprop;
        return $this;
    }

}
