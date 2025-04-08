import { InventoryTool, CodifyTool } from './tools';

describe('Tools', () => {
  // Test InventoryTool configuration
  describe('InventoryTool', () => {
    it('should have correct name and description', () => {
      expect(InventoryTool.name).toBe('firefly_inventory');
      expect(InventoryTool.description).toBeDefined();
    });

    it('should have valid input schema', () => {
      expect(InventoryTool.inputSchema).toBeDefined();
      expect(InventoryTool.inputSchema.type).toBe('object');
      expect(InventoryTool.inputSchema.properties).toBeDefined();
    });
  });

  // Test CodifyTool configuration
  describe('CodifyTool', () => {
    it('should have correct name and description', () => {
      expect(CodifyTool.name).toBe('firefly_codify');
      expect(CodifyTool.description).toBeDefined();
    });

    it('should have valid input schema', () => {
      expect(CodifyTool.inputSchema).toBeDefined();
      expect(CodifyTool.inputSchema.type).toBe('object');
      expect(CodifyTool.inputSchema.properties).toBeDefined();
    });

    it('should have required fields defined', () => {
      expect(CodifyTool.inputSchema.required).toEqual([
        'assetType',
        'assetId',
        'iacType',
        'provider',
        'accountNumber'
      ]);
    });
  });
}); 