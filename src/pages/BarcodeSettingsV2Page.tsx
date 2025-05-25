import React, { useState, useRef, useEffect } from 'react';
import { useBarcodeServiceV2 } from '../hooks/useBarcodeServiceV2';
import { BarcodeDataV2, BarcodeSettingsV2, PRINTER_TEMPLATES } from '../services/barcodeServiceV2';
import { Button, Card, Form, Input, Select, Slider, Switch, Tabs, message, Upload } from 'antd';
import { PrinterOutlined, SettingOutlined, EyeOutlined, SaveOutlined, UndoOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLanguageStore } from '../store/useLanguageStore';
import { barcodeSettingsV2Translations } from '../translations/barcodeSettingsV2';
import './BarcodeSettingsV2Page.css';

const { TabPane } = Tabs;
const { Option } = Select;

const BarcodeSettingsV2Page: React.FC = () => {
  const { language } = useLanguageStore();
  const t = barcodeSettingsV2Translations[language];
  
  const {
    printBarcode,
    getPreview,
    updateSettings,
    applyTemplate,
    resetSettings,
    exportSettings,
    importSettings,
    settings,
    isPrinting,
    printerTemplates
  } = useBarcodeServiceV2();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<BarcodeDataV2>({
    barcode: '123456789012', // 12 digits for UPC compatibility
    productName: language === 'ar' ? 'اسم المنتج' : 'Sample Product',
    price: 10.500,
    businessName: language === 'ar' ? 'اسم المؤسسة' : 'Tawliat Bait',
    vendorName: language === 'ar' ? 'اسم المورد' : 'Sample Vendor',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    productionDate: new Date().toISOString().split('T')[0],
    currency: 'OMR'
  });

  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Generate preview HTML
  const generatePreview = () => {
    // Ensure barcode is valid for the selected format
    let updatedPreviewData = { ...previewData };
    
    if (settings.barcodeFormat === 'UPC' && !/^\d{12}$/.test(previewData.barcode)) {
      // UPC requires exactly 12 digits
      let validatedBarcode = previewData.barcode.replace(/\D/g, ''); // Remove non-digits
      if (validatedBarcode.length < 12) {
        validatedBarcode = validatedBarcode.padStart(12, '0');
      } else if (validatedBarcode.length > 12) {
        validatedBarcode = validatedBarcode.substring(0, 12);
      }
      updatedPreviewData.barcode = validatedBarcode;
      setPreviewData(updatedPreviewData);
    } else if (settings.barcodeFormat === 'EAN13' && !/^\d{13}$/.test(previewData.barcode)) {
      // EAN13 requires exactly 13 digits
      let validatedBarcode = previewData.barcode.replace(/\D/g, ''); // Remove non-digits
      if (validatedBarcode.length < 13) {
        validatedBarcode = validatedBarcode.padStart(13, '0');
      } else if (validatedBarcode.length > 13) {
        validatedBarcode = validatedBarcode.substring(0, 13);
      }
      updatedPreviewData.barcode = validatedBarcode;
      setPreviewData(updatedPreviewData);
    }
    
    const html = getPreview(updatedPreviewData);
    setPreviewHtml(html);
  };

  // Print sample barcode
  const printSample = async () => {
    const success = await printBarcode(previewData);
    if (success) {
      message.success(t.barcodeSentToPrinter);
    } else {
      message.error(t.failedToPrintBarcode);
    }
  };

  // Apply printer template
  const handleApplyTemplate = (templateName: keyof typeof PRINTER_TEMPLATES) => {
    applyTemplate(templateName);
    message.success(`${t.appliedTemplate} ${templateName}`);
    generatePreview();
  };

  // Handle settings change
  const handleSettingsChange = (changedSettings: Partial<BarcodeSettingsV2>) => {
    updateSettings(changedSettings);
    
    // If barcode format changed, update the preview data to ensure valid format
    if (changedSettings.barcodeFormat) {
      let updatedPreviewData = { ...previewData };
      
      if (changedSettings.barcodeFormat === 'UPC') {
        // UPC requires exactly 12 digits
        let validatedBarcode = previewData.barcode.replace(/\D/g, ''); // Remove non-digits
        if (validatedBarcode.length < 12) {
          validatedBarcode = validatedBarcode.padStart(12, '0');
        } else if (validatedBarcode.length > 12) {
          validatedBarcode = validatedBarcode.substring(0, 12);
        }
        updatedPreviewData.barcode = validatedBarcode;
        setPreviewData(updatedPreviewData);
      } else if (changedSettings.barcodeFormat === 'EAN13') {
        // EAN13 requires exactly 13 digits
        let validatedBarcode = previewData.barcode.replace(/\D/g, ''); // Remove non-digits
        if (validatedBarcode.length < 13) {
          validatedBarcode = validatedBarcode.padStart(13, '0');
        } else if (validatedBarcode.length > 13) {
          validatedBarcode = validatedBarcode.substring(0, 13);
        }
        updatedPreviewData.barcode = validatedBarcode;
        setPreviewData(updatedPreviewData);
      }
    }
    
    generatePreview();
  };

  // Reset settings to defaults
  const handleResetSettings = () => {
    resetSettings();
    message.success(t.settingsResetToDefaults);
    generatePreview();
  };

  // Export settings to JSON file
  const handleExportSettings = () => {
    try {
      const jsonData = exportSettings();
      if (!jsonData) {
        message.error(t.failedToExportSettings);
        return;
      }

      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${t.exportSettingsTitle}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success(t.settingsExported);
    } catch (error) {
      console.error('Error exporting settings:', error);
      message.error(t.failedToExportSettings);
    }
  };

  // Import settings from JSON file
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const success = importSettings(jsonString);
        
        if (success) {
          message.success(t.settingsImported);
          generatePreview();
        } else {
          message.error(t.invalidSettingsFile);
        }
      } catch (error) {
        console.error('Error importing settings:', error);
        message.error(t.invalidSettingsFile);
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Generate preview on component mount
  useEffect(() => {
    generatePreview();
  }, []);

  // Update preview data when language changes
  useEffect(() => {
    setPreviewData({
      ...previewData,
      productName: language === 'ar' ? 'اسم المنتج' : 'Sample Product',
      businessName: language === 'ar' ? 'اسم المؤسسة' : 'Tawliat Bait',
      vendorName: language === 'ar' ? 'اسم المورد' : 'Sample Vendor',
    });
    // We don't call generatePreview() here as it will be called when previewData changes
  }, [language]);

  // Generate preview when previewData changes
  useEffect(() => {
    generatePreview();
  }, [previewData]);

  return (
    <div className="barcode-settings-page">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <PrinterOutlined className="text-blue-600" />
            {t.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.pageDescription}
          </p>
        </div>
      </div>
      
      <div className="page-content">
        <Tabs defaultActiveKey="preview">
          <TabPane tab={<span><EyeOutlined /> {t.previewTab}</span>} key="preview">
            <div className="preview-container">
              <Card title={t.barcodePreview} className="preview-card">
                <div className="preview-controls">
                  <Button 
                    type="primary" 
                    icon={<PrinterOutlined />} 
                    onClick={printSample}
                    loading={isPrinting}
                  >
                    {t.printSample}
                  </Button>
                  <Button 
                    icon={<EyeOutlined />} 
                    onClick={generatePreview}
                  >
                    {t.refreshPreview}
                  </Button>
                </div>
                
                <div className="preview-frame">
                  <iframe 
                    srcDoc={previewHtml}
                    title="Barcode Preview"
                    width="100%"
                    height="300px"
                    style={{ border: '1px solid #ccc' }}
                  />
                </div>
                
                <h3 className="preview-data-title">{t.testData}</h3>
                <div className="preview-data">
                  <Form layout="vertical">
                    <div className="preview-form-grid">
                      <Form.Item label={t.barcode}>
                        <Input 
                          value={previewData.barcode} 
                          onChange={e => setPreviewData({...previewData, barcode: e.target.value})}
                        />
                      </Form.Item>
                      <Form.Item label={t.productName}>
                        <Input 
                          value={previewData.productName} 
                          onChange={e => setPreviewData({...previewData, productName: e.target.value})}
                        />
                      </Form.Item>
                      <Form.Item label={t.price}>
                        <Input 
                          type="number"
                          value={previewData.price} 
                          onChange={e => setPreviewData({...previewData, price: parseFloat(e.target.value)})}
                        />
                      </Form.Item>
                      <Form.Item label={t.businessName}>
                        <Input 
                          value={previewData.businessName} 
                          onChange={e => setPreviewData({...previewData, businessName: e.target.value})}
                        />
                      </Form.Item>
                      <Form.Item label={t.vendorName}>
                        <Input 
                          value={previewData.vendorName} 
                          onChange={e => setPreviewData({...previewData, vendorName: e.target.value})}
                        />
                      </Form.Item>
                      <Form.Item label={t.expiryDate}>
                        <Input 
                          type="date"
                          value={previewData.expiryDate} 
                          onChange={e => setPreviewData({...previewData, expiryDate: e.target.value})}
                        />
                      </Form.Item>
                      <Form.Item label={t.productionDate}>
                        <Input 
                          type="date"
                          value={previewData.productionDate} 
                          onChange={e => setPreviewData({...previewData, productionDate: e.target.value})}
                        />
                      </Form.Item>
                    </div>
                    <Button type="primary" onClick={generatePreview}>{t.updatePreview}</Button>
                  </Form>
                </div>
              </Card>
            </div>
          </TabPane>
          
          <TabPane tab={<span><SettingOutlined /> {t.settingsTab}</span>} key="settings">
            <div className="settings-container">
              <h2 className="settings-section-title">{t.printerSettings}</h2>
              <Card title={t.printerTemplates} className="settings-card">
                <div className="template-buttons">
                  {Object.keys(printerTemplates).map((template) => (
                    <Button 
                      key={template}
                      onClick={() => handleApplyTemplate(template as keyof typeof PRINTER_TEMPLATES)}
                      type="default"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
                
                <div className="settings-actions">
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={handleExportSettings}
                    style={{ marginRight: 8 }}
                  >
                    {t.exportSettings}
                  </Button>
                  
                  <Button 
                    icon={<UploadOutlined />} 
                    onClick={triggerFileInput}
                    style={{ marginRight: 8 }}
                  >
                    {t.importSettings}
                  </Button>
                  
                  <Button 
                    icon={<UndoOutlined />} 
                    onClick={handleResetSettings}
                    danger
                  >
                    {t.resetAllSettings}
                  </Button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImportSettings}
                    accept=".json"
                  />
                </div>
              </Card>
              
              <h2 className="settings-section-title">{t.printerSettings}</h2>
              <Card title={t.printerSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.printerType}>
                    <Select 
                      value={settings.printerType}
                      onChange={value => handleSettingsChange({ printerType: value })}
                    >
                      <Option value="zebra">Zebra</Option>
                      <Option value="dymo">Dymo</Option>
                      <Option value="brother">Brother</Option>
                      <Option value="generic">Generic</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.labelWidth}>
                    <Slider 
                      min={20} 
                      max={120} 
                      value={settings.labelWidth}
                      onChange={value => handleSettingsChange({ labelWidth: value })}
                    />
                    <span>{settings.labelWidth} mm</span>
                  </Form.Item>
                  
                  <Form.Item label={t.labelHeight}>
                    <Slider 
                      min={10} 
                      max={100} 
                      value={settings.labelHeight}
                      onChange={value => handleSettingsChange({ labelHeight: value })}
                    />
                    <span>{settings.labelHeight} mm</span>
                  </Form.Item>
                </Form>
              </Card>
              
              <h2 className="settings-section-title">{t.contentSettings}</h2>
              <Card title={t.contentSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.showBusinessName}>
                    <Switch 
                      checked={settings.showBusinessName}
                      onChange={value => handleSettingsChange({ showBusinessName: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.showVendorName}>
                    <Switch 
                      checked={settings.showVendorName}
                      onChange={value => handleSettingsChange({ showVendorName: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.showProductName}>
                    <Switch 
                      checked={settings.showProductName}
                      onChange={value => handleSettingsChange({ showProductName: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.showPrice}>
                    <Switch 
                      checked={settings.showPrice}
                      onChange={value => handleSettingsChange({ showPrice: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.showExpiryDate}>
                    <Switch 
                      checked={settings.showExpiryDate}
                      onChange={value => handleSettingsChange({ showExpiryDate: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.showProductionDate}>
                    <Switch 
                      checked={settings.showProductionDate}
                      onChange={value => handleSettingsChange({ showProductionDate: value })}
                    />
                  </Form.Item>
                </Form>
              </Card>
              
              <h2 className="settings-section-title">{t.barcodeSettings}</h2>
              <Card title={t.barcodeSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.barcodeFormat}>
                    <Select 
                      value={settings.barcodeFormat}
                      onChange={value => handleSettingsChange({ 
                        barcodeFormat: value,
                        // Auto-enable QR code if QR format is selected
                        enableQRCode: value === 'QR'
                      })}
                    >
                      <Option value="CODE128">CODE128</Option>
                      <Option value="EAN13">EAN13</Option>
                      <Option value="UPC">UPC</Option>
                      <Option value="CODE39">CODE39</Option>
                      <Option value="QR">{t.qrCode}</Option>
                    </Select>
                  </Form.Item>
                  
                  {settings.barcodeFormat !== 'QR' && (
                    <>
                      <Form.Item label={t.barcodeWidth}>
                        <Slider 
                          min={20} 
                          max={100} 
                          value={settings.barcodeWidth}
                          onChange={value => handleSettingsChange({ barcodeWidth: value })}
                        />
                        <span>{settings.barcodeWidth} mm</span>
                      </Form.Item>
                      
                      <Form.Item label={t.barcodeHeight}>
                        <Slider 
                          min={5} 
                          max={50} 
                          value={settings.barcodeHeight}
                          onChange={value => handleSettingsChange({ barcodeHeight: value })}
                        />
                        <span>{settings.barcodeHeight} mm</span>
                      </Form.Item>
                      
                      <Form.Item label={t.lineWidth}>
                        <Slider 
                          min={0.5} 
                          max={3} 
                          step={0.1}
                          value={settings.barcodeLineWidth}
                          onChange={value => handleSettingsChange({ barcodeLineWidth: value })}
                        />
                        <span>{settings.barcodeLineWidth}</span>
                      </Form.Item>
                      
                      <Form.Item label={t.displayBarcodeText}>
                        <Switch 
                          checked={settings.displayBarcodeText}
                          onChange={value => handleSettingsChange({ displayBarcodeText: value })}
                        />
                      </Form.Item>
                    </>
                  )}
                  
                  {settings.barcodeFormat === 'QR' && (
                    <>
                      <Form.Item label={t.qrCodeContent}>
                        <Select 
                          value={settings.qrCodeContent}
                          onChange={value => handleSettingsChange({ qrCodeContent: value })}
                        >
                          <Option value="barcode">{t.qrCodeContentBarcode}</Option>
                          <Option value="custom">{t.qrCodeContentCustom}</Option>
                        </Select>
                      </Form.Item>
                      
                      {settings.qrCodeContent === 'custom' && (
                        <Form.Item label={t.qrCodeCustomContent}>
                          <Input 
                            value={settings.qrCodeCustomContent}
                            onChange={e => handleSettingsChange({ qrCodeCustomContent: e.target.value })}
                          />
                        </Form.Item>
                      )}
                      
                      <Form.Item label={t.qrCodeSize}>
                        <Slider 
                          min={10} 
                          max={100} 
                          value={settings.qrCodeSize}
                          onChange={value => handleSettingsChange({ qrCodeSize: value })}
                        />
                        <span>{settings.qrCodeSize} mm</span>
                      </Form.Item>
                      
                      <Form.Item label={t.qrCodeErrorCorrection}>
                        <Select 
                          value={settings.qrCodeErrorCorrection}
                          onChange={value => handleSettingsChange({ qrCodeErrorCorrection: value })}
                        >
                          <Option value="L">L - 7%</Option>
                          <Option value="M">M - 15%</Option>
                          <Option value="Q">Q - 25%</Option>
                          <Option value="H">H - 30%</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label={t.qrCodePosition}>
                        <Select 
                          value={settings.qrCodePosition}
                          onChange={value => handleSettingsChange({ qrCodePosition: value })}
                        >
                          <Option value="center">{t.center}</Option>
                          <Option value="left">{t.qrCodePositionLeft}</Option>
                          <Option value="right">{t.qrCodePositionRight}</Option>
                        </Select>
                      </Form.Item>
                      
                      {(settings.qrCodePosition === 'left' || settings.qrCodePosition === 'right') && (
                        <Form.Item label={t.splitLayoutRatio}>
                          <Slider 
                            min={0.2} 
                            max={0.8} 
                            step={0.05}
                            value={settings.splitLayoutRatio}
                            onChange={value => handleSettingsChange({ splitLayoutRatio: value })}
                          />
                          <span>{settings.splitLayoutRatio * 100}%</span>
                        </Form.Item>
                      )}
                    </>
                  )}
                </Form>
              </Card>
              
              <h2 className="settings-section-title">{t.spacingSettings}</h2>
              <Card title={t.spacingSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.lineSpacing}>
                    <Slider 
                      min={0.5} 
                      max={5} 
                      step={0.1}
                      value={settings.lineSpacing}
                      onChange={value => handleSettingsChange({ lineSpacing: value })}
                    />
                    <span>{settings.lineSpacing} mm</span>
                  </Form.Item>
                  
                  <Form.Item label={t.sectionSpacing}>
                    <Slider 
                      min={1} 
                      max={10} 
                      step={0.5}
                      value={settings.sectionSpacing}
                      onChange={value => handleSettingsChange({ sectionSpacing: value })}
                    />
                    <span>{settings.sectionSpacing} mm</span>
                  </Form.Item>
                  
                  <Form.Item label={t.globalSpacing}>
                    <Slider 
                      min={0.5} 
                      max={5} 
                      step={0.1}
                      value={settings.globalSpacing}
                      onChange={value => handleSettingsChange({ globalSpacing: value })}
                    />
                    <span>{settings.globalSpacing} mm</span>
                  </Form.Item>
                </Form>
              </Card>
              
              <h2 className="settings-section-title">{t.styleSettings}</h2>
              <Card title={t.styleSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.textAlignment}>
                    <Select 
                      value={settings.textAlignment}
                      onChange={value => handleSettingsChange({ textAlignment: value })}
                    >
                      <Option value="left">{t.left}</Option>
                      <Option value="center">{t.center}</Option>
                      <Option value="right">{t.right}</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.fontFamily}>
                    <Select 
                      value={settings.fontFamily}
                      onChange={value => handleSettingsChange({ fontFamily: value })}
                    >
                      <Option value="Arial, sans-serif">{t.arial}</Option>
                      <Option value="'Segoe UI', 'Helvetica Neue', Roboto, 'Open Sans', sans-serif">{t.sansSerifNormal}</Option>
                      <Option value="'Segoe UI Bold', 'Helvetica Neue Bold', 'Roboto Bold', 'Open Sans Bold', sans-serif">{t.sansSerifBold}</Option>
                      <Option value="'Times New Roman', serif">Times New Roman</Option>
                      <Option value="'Courier New', monospace">Courier New</Option>
                      <Option value="Verdana, sans-serif">Verdana</Option>
                      <Option value="Tahoma, sans-serif">Tahoma</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.globalFontWeight}>
                    <Select 
                      value={settings.globalFontWeight}
                      onChange={value => {
                        // Apply the same font weight to all text elements
                        handleSettingsChange({ 
                          globalFontWeight: value,
                          businessNameFontWeight: value,
                          productNameFontWeight: value,
                          priceFontWeight: value,
                          barcodeFontWeight: value,
                          datesFontWeight: value
                        });
                      }}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="500">500</Option>
                      <Option value="600">600</Option>
                      <Option value="700">700</Option>
                      <Option value="800">800</Option>
                      <Option value="900">900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.businessNameFontSize}>
                    <Slider 
                      min={5} 
                      max={14} 
                      value={settings.businessNameFontSize}
                      onChange={value => handleSettingsChange({ businessNameFontSize: value })}
                    />
                    <span>{settings.businessNameFontSize} pt</span>
                  </Form.Item>
                  
                  <Form.Item label={t.businessNameFontWeight}>
                    <Select 
                      value={settings.businessNameFontWeight}
                      onChange={value => handleSettingsChange({ businessNameFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.productNameFontSize}>
                    <Slider 
                      min={5} 
                      max={14} 
                      value={settings.productNameFontSize}
                      onChange={value => handleSettingsChange({ productNameFontSize: value })}
                    />
                    <span>{settings.productNameFontSize} pt</span>
                  </Form.Item>
                  
                  <Form.Item label={t.productNameFontWeight}>
                    <Select 
                      value={settings.productNameFontWeight}
                      onChange={value => handleSettingsChange({ productNameFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.priceFontSize}>
                    <Slider 
                      min={6} 
                      max={16} 
                      value={settings.priceFontSize}
                      onChange={value => handleSettingsChange({ priceFontSize: value })}
                    />
                    <span>{settings.priceFontSize} pt</span>
                  </Form.Item>
                  
                  <Form.Item label={t.priceFontWeight}>
                    <Select 
                      value={settings.priceFontWeight}
                      onChange={value => handleSettingsChange({ priceFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.barcodeFontWeight}>
                    <Select 
                      value={settings.barcodeFontWeight}
                      onChange={value => handleSettingsChange({ barcodeFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.datesFontWeight}>
                    <Select 
                      value={settings.datesFontWeight}
                      onChange={value => handleSettingsChange({ datesFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.dateFontSize}>
                    <Slider 
                      min={5} 
                      max={12} 
                      value={settings.dateFontSize}
                      onChange={value => handleSettingsChange({ dateFontSize: value })}
                    />
                    <span>{settings.dateFontSize} pt</span>
                  </Form.Item>
                  
                  <Form.Item label={t.dateFontWeight}>
                    <Select 
                      value={settings.dateFontWeight}
                      onChange={value => handleSettingsChange({ dateFontWeight: value })}
                    >
                      <Option value="normal">{t.normal}</Option>
                      <Option value="bold">{t.bold}</Option>
                      <Option value="bolder">{t.bolder}</Option>
                      <Option value="lighter">{t.lighter}</Option>
                      <Option value={500}>500</Option>
                      <Option value={600}>600</Option>
                      <Option value={700}>700</Option>
                      <Option value={800}>800</Option>
                      <Option value={900}>900</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label={t.rtl}>
                    <Switch 
                      checked={settings.rtl}
                      onChange={value => handleSettingsChange({ rtl: value })}
                    />
                  </Form.Item>
                  
                  <Form.Item label={t.darkMode}>
                    <Switch 
                      checked={settings.darkMode}
                      onChange={value => handleSettingsChange({ darkMode: value })}
                    />
                  </Form.Item>
                </Form>
              </Card>
              
              <div className="settings-actions">
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={generatePreview}
                >
                  {t.applySettingsAndPreview}
                </Button>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export { BarcodeSettingsV2Page };
export default BarcodeSettingsV2Page;