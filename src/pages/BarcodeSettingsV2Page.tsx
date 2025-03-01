import React, { useState, useRef } from 'react';
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
    barcode: '12345678901',
    productName: 'Sample Product',
    price: 10.500,
    businessName: 'Tawliat Bait',
    vendorName: 'Sample Vendor',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    productionDate: new Date().toISOString().split('T')[0],
    currency: 'OMR'
  });

  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Generate preview HTML
  const generatePreview = () => {
    const html = getPreview(previewData);
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
  React.useEffect(() => {
    generatePreview();
  }, []);

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
                    loading={isPrinting}
                    onClick={printSample}
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
                
                <div className="preview-data">
                  <h3>{t.testData}</h3>
                  <Form layout="vertical">
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
                    <Button type="primary" onClick={generatePreview}>{t.updatePreview}</Button>
                  </Form>
                </div>
              </Card>
            </div>
          </TabPane>
          
          <TabPane tab={<span><SettingOutlined /> {t.settingsTab}</span>} key="settings">
            <div className="settings-container">
              <Card title={t.printerTemplates} className="settings-card">
                <div className="template-buttons">
                  {Object.keys(printerTemplates).map((template) => (
                    <Button 
                      key={template}
                      onClick={() => handleApplyTemplate(template as keyof typeof PRINTER_TEMPLATES)}
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
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportSettings}
                    accept=".json"
                    style={{ display: 'none' }}
                  />
                  
                  <Button 
                    danger 
                    icon={<UndoOutlined />} 
                    onClick={handleResetSettings}
                  >
                    {t.resetAllSettings}
                  </Button>
                </div>
              </Card>
              
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
                      max={150} 
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
              
              <Card title={t.barcodeSettings} className="settings-card">
                <Form layout="vertical">
                  <Form.Item label={t.barcodeFormat}>
                    <Select 
                      value={settings.barcodeFormat}
                      onChange={value => handleSettingsChange({ barcodeFormat: value })}
                    >
                      <Option value="CODE128">CODE128</Option>
                      <Option value="EAN13">EAN13</Option>
                      <Option value="UPC">UPC</Option>
                      <Option value="CODE39">CODE39</Option>
                    </Select>
                  </Form.Item>
                  
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
                </Form>
              </Card>
              
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
                      <Option value="'Times New Roman', serif">{t.timesNewRoman}</Option>
                      <Option value="'Courier New', monospace">{t.courierNew}</Option>
                      <Option value="'Segoe UI', sans-serif">{t.segoeUI}</Option>
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
                  
                  <Form.Item label={t.productNameFontSize}>
                    <Slider 
                      min={5} 
                      max={14} 
                      value={settings.productNameFontSize}
                      onChange={value => handleSettingsChange({ productNameFontSize: value })}
                    />
                    <span>{settings.productNameFontSize} pt</span>
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