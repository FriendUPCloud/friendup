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

use Kigkonsult\Icalcreator\Vcalendar;

use function array_change_key_case;
use function array_filter;
use function array_merge;
use function ctype_digit;
use function in_array;
use function is_array;
use function is_null;
use function ksort;
use function sprintf;
use function strcasecmp;
use function strpos;
use function strtoupper;
use function trim;

/**
 * iCalcreator iCal parameters support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.6 - 2019-01-05
 */
class ParameterFactory
{
    /**
     * Return formatted output for calendar component property parameters
     *
     * @param array  $params
     * @param array  $ctrKeys
     * @param string $lang
     * @return string
     * @static
     * @since  2.26.1 - 2018-12-01
     */
    public static function createParams( $params = null, $ctrKeys = null, $lang = null ) {
        static $FMTFMTTYPE  = ';FMTTYPE=%s%s';
        static $FMTKEQV     = '%s=%s';
        static $PARAMSARRAY =  [
            Vcalendar::ALTREP,
            Vcalendar::CN,
            Vcalendar::DIR,
            Vcalendar::ENCODING,
            Vcalendar::FMTTYPE,
            Vcalendar::LANGUAGE,
            Vcalendar::RANGE,
            Vcalendar::RELTYPE,
            Vcalendar::SENT_BY,
            Vcalendar::TZID,
            Vcalendar::VALUE,
        ];
        static $FMTQ   = '"%s"';
        static $FMTQTD = ';%s=%s%s%s';
        static $FMTCMN = ';%s=%s';
        if( empty( $params ) && empty( $ctrKeys ) && empty( $lang )) {
            return Util::$SP0;
        }
        if( ! is_array( $params )) {
            $params = [];
        }
        if( empty( $ctrKeys )) {
            $ctrKeys = [];
        }
        elseif( ! is_array( $ctrKeys )) {
            $ctrKeys = [ $ctrKeys ];
        }
        $attrLANG       = $attr1 = $attr2 = null;
        $hasCNattrKey   = ( in_array( Vcalendar::CN, $ctrKeys ));
        $hasLANGattrKey = ( in_array( Vcalendar::LANGUAGE, $ctrKeys ));
        $CNattrExist    = false;
        $xparams        = [];
        $params         = array_change_key_case( $params, CASE_UPPER );
        foreach( $params as $paramKey => $paramValue ) {
            if(( false !== strpos( $paramValue, Util::$COLON )) ||
               ( false !== strpos( $paramValue, Util::$SEMIC )) ||
               ( false !== strpos( $paramValue, Util::$COMMA ))) {
                $paramValue = sprintf( $FMTQ, $paramValue );
            }
            if( ctype_digit((string) $paramKey )) { // ??
                $xparams[] = $paramValue;
                continue;
            }
            if( ! in_array( $paramKey, $PARAMSARRAY )) {
                $xparams[$paramKey] = $paramValue;
            }
            else {
                $params[$paramKey] = $paramValue;
            }
        }
        ksort( $xparams, SORT_STRING );
        foreach( $xparams as $paramKey => $paramValue ) {
            $attr2 .= Util::$SEMIC;
            $attr2 .= ( ctype_digit((string) $paramKey ))
                ? $paramValue
                : sprintf( $FMTKEQV, $paramKey, $paramValue );
        }
        if( isset( $params[Vcalendar::FMTTYPE] ) && ! in_array( Vcalendar::FMTTYPE, $ctrKeys )) {
            $attr1 .= sprintf( $FMTFMTTYPE, $params[Vcalendar::FMTTYPE], $attr2 );
            $attr2 = null;
        }
        if( isset( $params[Vcalendar::ENCODING] ) && ! in_array( Vcalendar::ENCODING, $ctrKeys )) {
            if( ! empty( $attr2 )) {
                $attr1 .= $attr2;
                $attr2 = null;
            }
            $attr1 .= sprintf( $FMTCMN, Vcalendar::ENCODING, $params[Vcalendar::ENCODING] );
        }
        if( isset( $params[Vcalendar::VALUE] ) && ! in_array( Vcalendar::VALUE, $ctrKeys )) {
            $attr1 .= sprintf( $FMTCMN, Vcalendar::VALUE, $params[Vcalendar::VALUE] );
        }
        if( isset( $params[Vcalendar::TZID] ) && ! in_array( Vcalendar::TZID, $ctrKeys )) {
            $attr1 .= sprintf( $FMTCMN, Vcalendar::TZID, $params[Vcalendar::TZID] );
        }
        if( isset( $params[Vcalendar::RANGE] ) && ! in_array( Vcalendar::RANGE, $ctrKeys )) {
            $attr1 .= sprintf( $FMTCMN, Vcalendar::RANGE, $params[Vcalendar::RANGE] );
        }
        if( isset( $params[Vcalendar::RELTYPE] ) && ! in_array( Vcalendar::RELTYPE, $ctrKeys )) {
            $attr1 .= sprintf( $FMTCMN, Vcalendar::RELTYPE, $params[Vcalendar::RELTYPE] );
        }
        if( isset( $params[Vcalendar::CN] ) && $hasCNattrKey ) {
            $attr1       = sprintf( $FMTCMN, Vcalendar::CN, $params[Vcalendar::CN] );
            $CNattrExist = true;
        }
        if( isset( $params[Vcalendar::DIR] ) && in_array( Vcalendar::DIR, $ctrKeys )) {
            $delim = ( false !== strpos( $params[Vcalendar::DIR], Util::$QQ )) ? null : Util::$QQ;
            $attr1 .= sprintf( $FMTQTD, Vcalendar::DIR, $delim, $params[Vcalendar::DIR], $delim );
        }
        if( isset( $params[Vcalendar::SENT_BY] ) && in_array( Vcalendar::SENT_BY, $ctrKeys )) {
            $attr1 .= sprintf( $FMTCMN, Vcalendar::SENT_BY, $params[Vcalendar::SENT_BY] );
        }
        if( isset( $params[Vcalendar::ALTREP] ) && in_array( Vcalendar::ALTREP, $ctrKeys )) {
            $delim = ( false !== strpos( $params[Vcalendar::ALTREP], Util::$QQ )) ? null : Util::$QQ;
            $attr1 .= sprintf( $FMTQTD, Vcalendar::ALTREP, $delim, $params[Vcalendar::ALTREP], $delim );
        }
        if( isset( $params[Vcalendar::LANGUAGE] ) && $hasLANGattrKey ) {
            $attrLANG .= sprintf( $FMTCMN, Vcalendar::LANGUAGE, $params[Vcalendar::LANGUAGE] );
        }
        elseif(( $CNattrExist || $hasLANGattrKey ) && ! empty( $lang )) {
            $attrLANG .= sprintf( $FMTCMN, Vcalendar::LANGUAGE, $lang );
        }
        return $attr1 . $attrLANG . $attr2;
    }

    /**
     * Remove expected key/value from array and returns foundValue (if found) else returns elseValue
     *
     * @param array   $array          iCal property parameters
     * @param string  $expectedKey    expected key
     * @param string  $expectedValue  expected value
     * @param int     $returnValue    return value if found
     * @param int     $elseValue      return value if not found
     * @param int     $preSet         return value if already preset
     * @return int
     * @static
     * @since  2.24.1 - 2018-10-22
     */
    public static function existRem(
        array & $array,
        $expectedKey,
        $expectedValue  = null,
        $returnValue    = null,
        $elseValue      = null,
        $preSet         = null
    ) {
        if( ! is_null( $preSet )) {
            return $preSet;
        }
        if( empty( $array )) {
            return $elseValue;
        }
        foreach( $array as $key => $value ) {
            if( 0 == strcasecmp( $expectedKey, $key )) {
                if( empty( $expectedValue ) || ( 0 == strcasecmp( $expectedValue, $value ))) {
                    unset( $array[$key] );
                    $array = array_filter( $array );
                    return $returnValue;
                }
            }
        }
        return $elseValue;
    }

    /**
     * Return true if property parameter VALUE is set to argument, otherwise false
     *
     * @param array  $parameterArr
     * @param string $arg
     * @return bool
     * @static
     * @since  2.27.14 - 2019-03-01
     */
    public static function isParamsValueSet( $parameterArr, $arg ) {
        if( empty( $parameterArr ) ||  ! isset( $parameterArr[Util::$LCparams] )) {
            return  false;
        }
        return Util::issetKeyAndEquals( $parameterArr[Util::$LCparams], Vcalendar::VALUE, strtoupper( $arg ));
    }

    /**
     * Return param[TZID] or null
     *
     * @param array  $parameterArr
     * @return string|null
     * @static
     * @since  2.27.14 - 2019-02-10
     */
    public static function getParamTzid( $parameterArr ) {
        return ( isset( $parameterArr[Util::$LCparams][Vcalendar::TZID] ))
            ? $parameterArr[Util::$LCparams][Vcalendar::TZID] : null;
    }

    /**
     * Return (conformed) iCal component property parameters
     *
     * Trim quoted values, default parameters may be set, if missing
     *
     * @param array $params
     * @param array $defaults
     * @return array
     * @static
     * @since  2.27.2 - 2019-01-18
     */
    public static function setParams( $params, $defaults = null ) {
        $output = [];
        if( empty( $params ) && empty( $defaults )) {
            return $output;
        }
        if( ! is_array( $params )) {
            $params = [];
        }
        $params = array_change_key_case( $params, CASE_UPPER );
        foreach( $params as $paramKey => $paramValue ) {
            if( is_array( $paramValue )) {
                foreach( $paramValue as $pkey => $pValue ) {
                    $paramValue[$pkey] = trim( $pValue, Util::$QQ );
                }
            }
            else {
                $paramValue = trim( $paramValue, Util::$QQ );
            }
            if( Vcalendar::VALUE == $paramKey ) {
                $output[Vcalendar::VALUE] = strtoupper( $paramValue );
            }
            else {
                $output[$paramKey] = $paramValue;
            }
        } // end foreach
        if( is_array( $defaults )) {
            $output = array_merge( array_change_key_case( $defaults, CASE_UPPER ), $output );
        }
        return $output;
    }

}
