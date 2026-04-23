import { AlertCircle } from 'lucide-react';
import { Button } from 'antd';
import type { RoomMissingInitialReading } from '@/types';

interface MissingInitialWarningProps {
  rooms: RoomMissingInitialReading[];
  onEntry: (room: RoomMissingInitialReading) => void;
}

export function MissingInitialWarning({ rooms, onEntry }: MissingInitialWarningProps) {
  if (rooms.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <span className="font-medium text-orange-800">缺失初始读数</span>
      </div>
      <p className="mb-3 text-sm text-orange-700">
        以下房间已签约但尚未录入签约月的初始水电读数，请及时补录
      </p>
      <div className="rounded border border-orange-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2 text-left font-medium">公寓</th>
              <th className="px-3 py-2 text-left font-medium">房间号</th>
              <th className="px-3 py-2 text-left font-medium">租客</th>
              <th className="px-3 py-2 text-left font-medium">签约日期</th>
              <th className="px-3 py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.room_id} className="border-b last:border-0">
                <td className="px-3 py-2">{room.apartment_name}</td>
                <td className="px-3 py-2">{room.room_number}</td>
                <td className="px-3 py-2">{room.tenant_name}</td>
                <td className="px-3 py-2">{room.lease_start_date}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="small" onClick={() => onEntry(room)}>
                    录入
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-orange-600">
        点击「录入」可快速录入该房间签约月的初始水电读数
      </p>
    </div>
  );
}