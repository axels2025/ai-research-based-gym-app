import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Equipment {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

interface EquipmentSelectorProps {
  equipment: Equipment[];
  selectedEquipment: string[];
  onChange: (selectedEquipment: string[]) => void;
  title: string;
  description?: string;
  allowMultiple?: boolean;
}

export function EquipmentSelector({
  equipment,
  selectedEquipment,
  onChange,
  title,
  description,
  allowMultiple = true,
}: EquipmentSelectorProps) {
  const handleEquipmentToggle = (equipmentValue: string) => {
    if (allowMultiple) {
      if (selectedEquipment.includes(equipmentValue)) {
        onChange(selectedEquipment.filter(eq => eq !== equipmentValue));
      } else {
        onChange([...selectedEquipment, equipmentValue]);
      }
    } else {
      onChange([equipmentValue]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipment.map((item) => (
          <Card
            key={item.value}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedEquipment.includes(item.value) && "border-primary bg-primary/5"
            )}
            onClick={() => handleEquipmentToggle(item.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.label}</h4>
                    {selectedEquipment.includes(item.value) && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}