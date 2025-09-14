<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
  <html>
    <head>
      <title><xsl:value-of select="/atom:feed/atom:title"/></title>
      <link rel="stylesheet" href="https://assets.aspectran.com/bootstrap@5.3.8/css/atom.css"/>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.min.js" integrity="sha256-ew8UiV1pJH/YjpOEBInP1HxVvT/SfrCmwSoUzF9JIgc=" crossorigin="anonymous"></script>
    </head>
    <body>
      <div class="container">
        <xsl:apply-templates select="/atom:feed"/>
      </div>
    </body>
  </html>
</xsl:template>

<xsl:template match="atom:feed">
  <div class="row">
    <div class="col-12">
      <header class="my-4">
        <p class="lead"><xsl:value-of select="atom:subtitle" disable-output-escaping="yes" /></p>
        <h1>
          <a href="{atom:link[@rel='alternate']/@href}">
            <xsl:value-of select="atom:title" />
          </a>
        </h1>
      </header>
      <div class="accordion" id="atomAccordion">
        <xsl:apply-templates select="atom:entry"/>
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template match="atom:entry">
  <xsl:variable name="slug-id">
    <xsl:call-template name="slugify">
      <xsl:with-param name="text" select="atom:id" />
    </xsl:call-template>
  </xsl:variable>
  <div class="accordion-item">
    <h2 class="accordion-header">
      <xsl:attribute name="id"><xsl:value-of select="concat($slug-id, '-heading')"/></xsl:attribute>
      <button class="accordion-button collapsed" type="button">
        <xsl:attribute name="data-bs-toggle">collapse</xsl:attribute>
        <xsl:attribute name="data-bs-target"><xsl:value-of select="concat('#', $slug-id)"/></xsl:attribute>
        <xsl:attribute name="aria-expanded">false</xsl:attribute>
        <xsl:attribute name="aria-controls"><xsl:value-of select="$slug-id"/></xsl:attribute>
        <xsl:value-of select="atom:title"/>
        <br/>
        <small><xsl:value-of select="atom:updated"/></small>
      </button>
    </h2>
    <div class="accordion-collapse collapse">
      <xsl:attribute name="id"><xsl:value-of select="$slug-id"/></xsl:attribute>
      <xsl:attribute name="aria-labelledby"><xsl:value-of select="concat($slug-id, '-heading')"/></xsl:attribute>
      <xsl:attribute name="data-bs-parent">#atomAccordion</xsl:attribute>
      <div class="accordion-body">
        <h1>
          <a href="{atom:link/@href}"><xsl:value-of select="atom:title"/></a>
        </h1>
        <xsl:value-of select="atom:content" disable-output-escaping="yes" />
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template name="slugify">
  <xsl:param name="text"/>
  <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'"/>
  <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
  <xsl:variable name="allowed" select="'0123456789abcdefghijklmnopqrstuvwxyz-'"/>
  <xsl:variable name="lowercase" select="translate($text, $upper, $lower)"/>
  <xsl:variable name="special-chars-to-dash" select="translate($lowercase, ' ~!@#$%^&amp;*()+=[]{}|\:;&quot;.?/`', '----------------------------------')"/>
  <xsl:variable name="cleaned" select="translate($special-chars-to-dash, translate($special-chars-to-dash, $allowed, ''), '')"/>
  <xsl:variable name="no-multi-dash" select="normalize-space(translate($cleaned, '-', ' '))"/>
  <xsl:value-of select="translate($no-multi-dash, ' ', '-')"/>
</xsl:template>

</xsl:stylesheet>