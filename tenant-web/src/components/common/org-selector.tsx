
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth';
import { invalidateOrgScopedQueries } from '@propease/web-shared';
import { Modal, Button, Radio } from 'antd';
import { Building2, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface OrgSelectorRef {
  openModal: () => void;
}

export const OrgSelector = forwardRef<OrgSelectorRef>((_, ref) => {
  const { organization, organizations, setOrganization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setSelectedOrgId(organization?.id ?? null);
      setOrgModalOpen(true);
    },
  }));

  const handleOpenModal = () => {
    setSelectedOrgId(organization?.id ?? null);
    setOrgModalOpen(true);
  };

  const handleConfirmSwitch = () => {
    if (selectedOrgId && selectedOrgId !== organization?.id) {
      const org = organizations.find((o) => o.id.toString() === selectedOrgId);
      if (org) {
        setOrganization(org);
        invalidateOrgScopedQueries(queryClient);
        navigate(0);
      }
    }
    setOrgModalOpen(false);
  };

  if (organizations.length === 0) {
    return (
      <Button onClick={() => navigate('/organizations/new')} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">创建团队</span>
      </Button>
    );
  }

  return (
    <>
      {/* 桌面端：简短按钮触发 */}
      <Button onClick={handleOpenModal} className="hidden md:flex gap-1.5">
        <Building2 className="h-4 w-4" />
        <span className="max-w-[120px] truncate">{organization?.name || '选择团队'}</span>
      </Button>

      <Modal
        open={orgModalOpen}
        onCancel={() => setOrgModalOpen(false)}
        title="切换团队"
        footer={[
          <Button key="cancel" onClick={() => setOrgModalOpen(false)}>取消</Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmSwitch}
            disabled={selectedOrgId === organization?.id}
          >
            确认切换
          </Button>,
        ]}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <Radio.Group
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="flex flex-col gap-3"
        >
          {organizations.map((org) => (
            <Radio key={org.id} value={org.id} className="flex items-center gap-2">
              <span className="truncate">{org.name}</span>
            </Radio>
          ))}
        </Radio.Group>
        <Button
          type="link"
          onClick={() => {
            setOrgModalOpen(false);
            navigate('/organizations');
          }}
          className="mt-4 px-0"
        >
          <Settings className="inline mr-1 h-4 w-4" />
          管理团队
        </Button>
      </Modal>
    </>
  );
});

OrgSelector.displayName = 'OrgSelector';
