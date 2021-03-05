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
 * CATEGORIES property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait CATEGORIEStrait
{
    /**
     * @var array component property CATEGORIES value
     * @access protected
     */
    protected $categories = null;

    /**
     * Return formatted output for calendar component property categories
     *
     * @return string
     */
    public function createCategories() {
        if( empty( $this->categories )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->categories as $cx => $category ) {
            if( empty( $category[Util::$LCvalue] )) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( self::CATEGORIES );
                }
                continue;
            }
            if( is_array( $category[Util::$LCvalue] )) {
                foreach( $category[Util::$LCvalue] as $cix => $cValue ) {
                    $category[Util::$LCvalue][$cix] = StringFactory::strrep( $cValue );
                }
                $content = implode( Util::$COMMA, $category[Util::$LCvalue] );
            }
            else {
                $content = StringFactory::strrep( $category[Util::$LCvalue] );
            }
            $output .= StringFactory::createElement(
                self::CATEGORIES,
                ParameterFactory::createParams(
                    $category[Util::$LCparams],
                    [ self::LANGUAGE ],
                    $lang
                ),
                $content
            );
        }
        return $output;
    }

    /**
     * Delete calendar component property categories
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteCategories( $propDelIx = null ) {
        if( empty( $this->categories )) {
            unset( $this->propDelIx[self::CATEGORIES] );
            return false;
        }
        return $this->deletePropertyM( $this->categories, self::CATEGORIES, $propDelIx );
    }

    /**
     * Get calendar component property categories
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getCategories( $propIx = null, $inclParam = false ) {
        if( empty( $this->categories )) {
            unset( $this->propIx[self::CATEGORIES] );
            return false;
        }
        return $this->getPropertyM( $this->categories, self::CATEGORIES, $propIx, $inclParam );
    }

    /**
     * Set calendar component property categories
     *
     * @param mixed   $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setCategories( $value = null, $params = null, $index = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::CATEGORIES );
            $value  = Util::$SP0;
            $params = [];
        }
        $this->setMval( $this->categories, $value, $params, null, $index );
        return $this;
    }
}
