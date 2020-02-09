---
layout: xml-style
title: "Atom Feed (Styled)"
sitemap: false
rootMatcher: '/atom:feed'
stylesheetAttributes: 'xmlns:atom="http://www.w3.org/2005/Atom"'
disclaimer: 'This <a href="https://en.wikipedia.org/wiki/RSS" target="_blank">Atom feed</a> is meant to be used by <a href="https://en.wikipedia.org/wiki/Template:Aggregators" target="_blank">RSS reader applications and websites</a>.'
---
<header class="t10 row">
	<p class="subheadline"><xsl:value-of select="atom:subtitle" disable-output-escaping="yes" /></p>
	<h1>
		<xsl:element name="a">
			<xsl:attribute name="href">
				<xsl:value-of select="atom:id" />
			</xsl:attribute>
			<xsl:value-of select="atom:title" />
		</xsl:element>
	</h1>
</header>
<div class="row">
  <ul class="accordion" data-accordion="" data-allow-all-closed="true">
  	<xsl:for-each select="atom:entry">
  		<li class="accordion-item">
  			<xsl:variable name="slug-id">
  				<xsl:call-template name="slugify">
  					<xsl:with-param name="text" select="atom:id" />
  				</xsl:call-template>
  			</xsl:variable>
  			<xsl:element name="a">
  				<xsl:attribute name="href"><xsl:value-of select="concat('#', $slug-id)"/></xsl:attribute>
          <xsl:attribute name="role">tab</xsl:attribute>
          <xsl:attribute name="class">accordion-title</xsl:attribute>
          <xsl:attribute name="id"><xsl:value-of select="$slug-id"/>-heading</xsl:attribute>
          <xsl:attribute name="aria-controls"><xsl:value-of select="$slug-id"/></xsl:attribute>
  				<xsl:value-of select="atom:title"/>
  				<br/>
  				<small><xsl:value-of select="atom:updated"/></small>
  			</xsl:element>
  			<xsl:element name="div">
  				<xsl:attribute name="id"><xsl:value-of select="$slug-id"/></xsl:attribute>
          <xsl:attribute name="data-tab-content"></xsl:attribute>
          <xsl:attribute name="role">tabpanel</xsl:attribute>
          <xsl:attribute name="class">accordion-content</xsl:attribute>
          <xsl:attribute name="aria-labelledby"><xsl:value-of select="$slug-id"/>-heading</xsl:attribute>
  				<h1>
  					<xsl:element name="a">
  						<xsl:attribute name="href"><xsl:value-of select="atom:id"/></xsl:attribute>
  						<xsl:value-of select="atom:title"/>
  					</xsl:element>
  				</h1>
  				<xsl:value-of select="atom:content" disable-output-escaping="yes" />
  			</xsl:element>
  		</li>
  	</xsl:for-each>
  </ul>
</div>
