import React from 'react';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const ProductVariantEditor = ({ 
  variants, 
  onVariantChange, 
  onAddVariant, 
  onRemoveVariant,
  onToggleAvailability,
  mode = 'add' // 'add' or 'edit'
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label className="text-lg font-bold">
          {mode === 'edit' ? 'Varijante' : 'Varijante (Opcije)'}
        </Label>
        <Button
          type="button"
          size="sm"
          onClick={onAddVariant}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={16} />
          {mode === 'edit' ? 'Dodaj Novu Opciju' : 'Dodaj Opciju'}
        </Button>
      </div>
      
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <Card key={variant.id || index} className="p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-gray-900">
                {mode === 'edit' ? `Varijanta ${index + 1}` : `Opcija ${index + 1}`}
              </h4>
              <div className="flex gap-2">
                {mode === 'edit' && onToggleAvailability && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onToggleAvailability(index)}
                    className={variant.available ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                  >
                    {variant.available ? (
                      <>
                        <Power size={14} className="mr-1" />
                        Aktivna
                      </>
                    ) : (
                      <>
                        <PowerOff size={14} className="mr-1" />
                        Neaktivna
                      </>
                    )}
                  </Button>
                )}
                {variants.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveVariant(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Variant Name */}
              <div>
                <Label className="text-xs font-semibold mb-1 block">
                  {mode === 'edit' ? 'Naziv Varijante' : 'Naziv Opcije'}
                </Label>
                <Input
                  value={variant.name}
                  onChange={(e) => onVariantChange(index, 'name', e.target.value)}
                  placeholder="Npr: Mali format"
                  className="w-full"
                />
              </div>

              {/* Variant Description */}
              <div>
                <Label className="text-xs font-semibold mb-1 block">
                  {mode === 'edit' ? 'Opis Varijante' : 'Opis (Dimenzije)'}
                </Label>
                <Input
                  value={variant.description}
                  onChange={(e) => onVariantChange(index, 'description', e.target.value)}
                  placeholder="Npr: Dimenzije: 10x15cm"
                  className="w-full"
                />
              </div>

              {/* Variant Price */}
              <div>
                <Label className="text-xs font-semibold mb-1 block">Cena (RSD)</Label>
                <Input
                  type="number"
                  value={variant.price}
                  onChange={(e) => onVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductVariantEditor;
