<?xml version="1.0" encoding="utf-8"?>
<!--

    MODÈLE : checkParams.xsl - 20/11/2015 @MCM

    DESCRIPTION :
        Valide le contenu de la requête POST de GetLicense.

    INPUT :
        - INPUT

    PARAMS :
        -

    OUTPUT : null

    ERREURS :
        - Requête rejetée si au moins une erreur de validation rencontrée (erreur 400 - BAD Request)
 -->
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:dp="http://www.datapower.com/extensions"
                xmlns:regexp="http://exslt.org/regular-expressions"
                xmlns:dpc="http://www.datapower.com/param/config"
                xmlns:edb='http://bouyguestelecom.fr/Services/EDBCheck.xsd'
                xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
                xmlns:func="http://exslt.org/functions"
                xmlns:cppe="http://exs.bytel.com/ProfileExposition/checkParams.xsl"
                extension-element-prefixes="#all">

    <!-- expression régulière d'une date de la forme : "2015-10-07T08:54:31.134+02:00" -->
    <xsl:variable name="patternDate" select="'^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])\.([0-9]{3})\+([01][0-9]|2[0-3]):([0-5][0-9])$'"/>
    <xsl:variable name="patternbase64" select="'^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'"/>

    <xsl:template match="/">

        <xsl:message dp:type="getLicense" dp:priority="debug">count= <xsl:value-of select="count(/*)"/></xsl:message>

        <xsl:variable name="drmDeviceID" select="string(/*/drmDeviceId/text())"/>
        <xsl:variable name="drmChannelID" select="string(/*/drmChannelId/text())"/>
        <xsl:variable name="drmType" select="string(/*/drmType/text())"/>
        <xsl:variable name="payload" select="string(/*/payload/text())"/>
        <xsl:variable name="keyId" select="string(/*/keyId/text())"/>
        <xsl:variable name="date" select="string(/*/date/text())"/>

        <xsl:message dp:type="getLicense" dp:priority="debug">drmDeviceID : <xsl:value-of select="$drmDeviceID"/></xsl:message>
        <xsl:message dp:type="getLicense" dp:priority="debug">drmChannelID : <xsl:value-of select="$drmChannelID"/></xsl:message>
        <xsl:message dp:type="getLicense" dp:priority="debug">drmType : <xsl:value-of select="$drmType"/></xsl:message>
        <xsl:message dp:type="getLicense" dp:priority="debug">payload : <xsl:value-of select="$payload"/></xsl:message>
        <xsl:message dp:type="getLicense" dp:priority="debug">keyId : <xsl:value-of select="$keyId"/></xsl:message>
        <xsl:message dp:type="getLicense" dp:priority="debug">date : <xsl:value-of select="$date"/></xsl:message>

        <!-- Si ces variables sont vide, nous sommes en erreur -->
        <xsl:if test="not($drmDeviceID) or not($drmChannelID) or not($drmType) or not($payload)">
            <xsl:message dp:type="getLicense" dp:priority="error">parametres vide</xsl:message>
            <dp:reject override="true">BAD_REQUEST</dp:reject>
        </xsl:if>

        <!-- drmDeviceID contient 33 caractere MAX -->
        <xsl:if test="string-length($drmDeviceID) > 33">
            <xsl:message dp:type="getLicense" dp:priority="error">le parametre drmDeviceID a plus de 33 caracteres</xsl:message>
            <dp:reject override="true">BAD_REQUEST</dp:reject>
        </xsl:if>

        <!-- drmDeviceID contient 33 caractere MAX -->
        <xsl:if test="string-length($drmChannelID) != 16">
            <xsl:message dp:type="getLicense" dp:priority="error">le parametre drmChannelID ne possede pas exactement 16 caracteres</xsl:message>
            <dp:reject override="true">BAD_REQUEST</dp:reject>
        </xsl:if>

        <!-- drmType -->
        <xsl:if test="($drmType != 'PLAYREADY') and ($drmType != 'WIDEVINE') and ($drmType != 'FAIRPLAY')">
            <xsl:message dp:type="getLicense" dp:priority="error">le parametre drmType est different de PLAYREADY ou WIDEVINE ou FAIRPLAY</xsl:message>
            <dp:reject override="true">BAD_REQUEST</dp:reject>
        </xsl:if>

        <!-- Si le keyID est initialise -->
        <xsl:if test="/*/keyId">
            <xsl:if test="string-length($keyId) != 16">
                <xsl:message dp:type="getLicense" dp:priority="error">le parametre keyId ne possede pas exactement 16 caracteres</xsl:message>
                <dp:reject override="true">BAD_REQUEST</dp:reject>
            </xsl:if>
        </xsl:if>

        <!-- Si la date est initialisee -->
        <xsl:if test="/*/date">
            <xsl:if test="not(regexp:match($date, $patternDate))">
                <xsl:message dp:type="getLicense" dp:priority="error">le parametre date n'est pas au bon format</xsl:message>
                <dp:reject override="true">BAD_REQUEST</dp:reject>
            </xsl:if>
        </xsl:if>

        <xsl:message dp:type="getLicense" dp:priority="error">WESH !!!!</xsl:message>
        <!-- Si le drmType = widevine ou playready -->
        <xsl:if test="($drmType = 'PLAYREADY') and ($drmType = 'WIDEVINE')">
            <xsl:message dp:type="getLicense" dp:priority="error">WESH !!!!</xsl:message>
            <xsl:if test="string-length($payload) % 4 != 0">
                <xsl:message dp:type="getlicense" dp:priority="error">payload : <xsl:value-of select="$xsa"/> => n'est pas en base64 (non modulo 4)</xsl:message>
                <dp:reject override="true">BAD_REQUEST</dp:reject>
            </xsl:if>
            <xsl:if test="not(regexp:match($payload, $patternBase64))">
                <xsl:message dp:type="getlicense" dp:priority="error">payload : <xsl:value-of select="$xsa"/> => n'est pas en base64 (je respecte pas le base64)</xsl:message>
                <dp:reject override="true">BAD_REQUEST</dp:reject>
            </xsl:if>
        </xsl:if>

    </xsl:template>
</xsl:stylesheet>