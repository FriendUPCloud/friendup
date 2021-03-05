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

namespace Kigkonsult\Icalcreator\Util;

use function abs;
use function sprintf;
use function rtrim;

/**
 * iCalcreator geo support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.26 - 2018-11-10
 */
class GeoFactory
{
    /**
     * @var string  GEO vars: output format for geo latitude and longitude (before rtrim) etc
     * @access public
     * @static
     */
    public static $geoLatFmt  = '%09.6f';
    public static $geoLongFmt = '%8.6f';
    /* @deprecated */
    public static $LATITUDE   = 'latitude';
    /* @deprecated */
    public static $LONGITUDE  = 'longitude';

    /**
     * Return formatted geo output
     *
     * @param float  $ll
     * @param string $format
     * @return string
     * @access public
     * @static
     */
    public static function geo2str2( $ll, $format ) {
        if( 0.0 < $ll ) {
            $sign = Util::$PLUS;
        }
        else {
            $sign = ( 0.0 > $ll ) ? Util::$MINUS : null;
        }
        return rtrim( rtrim( $sign . sprintf( $format, abs( $ll )), Util::$ZERO ), Util::$DOT );
    }
}
