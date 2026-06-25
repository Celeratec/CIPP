import { Layout as DashboardLayout } from '../../../../layouts/index.js'
import { CippTablePage } from '../../../../components/CippComponents/CippTablePage.jsx'
import { Check, Block, Settings, Public } from '@mui/icons-material'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { useSettings } from '../../../../hooks/use-settings.js'

const Page = () => {
  const pageTitle = 'Auth Methods'
  const tenant = useSettings().currentTenant
  const apiUrl = '/api/ListGraphRequest'

  // Columns configuration based on provided structure
  const simpleColumns = ['id', 'state', 'includeTargets', 'excludeTargets']

  // Tri-state dropdown shared by several Microsoft feature settings
  const tristateOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Enabled', value: 'enabled' },
    { label: 'Disabled', value: 'disabled' },
  ]

  // Group picker reused by "Deploy to Custom Group" and the Email exclude-groups field
  const groupFieldApi = {
    url: '/api/ListGraphRequest',
    dataKey: 'Results',
    queryKey: `ListAuthenticationPolicyGroups-${tenant}`,
    labelField: (group) => (group.id ? `${group.displayName} (${group.id})` : group.displayName),
    valueField: 'id',
    addedField: {
      description: 'description',
    },
    data: {
      Endpoint: 'groups',
      manualPagination: true,
      $select: 'id,displayName,description',
      $orderby: 'displayName',
      $top: 999,
      $count: true,
    },
  }

  // Coerce a number field (registered as a string) to a Number, dropping empties
  const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v))

  // Match a method row by id, case-insensitively (Graph casing varies)
  const isId = (row, id) => row?.id?.toLowerCase() === id.toLowerCase()

  // Methods that expose configurable sub-settings (others only support enable/disable + targeting)
  const configurableMethods = [
    'TemporaryAccessPass',
    'MicrosoftAuthenticator',
    'Email',
    'QRCodePin',
    'Fido2',
    'Voice',
    'SMS',
  ]

  // Single "Configure" action: every method's fields live here, shown per-row via condition
  const configFields = [
    // Temporary Access Pass
    {
      type: 'switch',
      name: 'TAPisUsableOnce',
      label: 'One-time use only',
      rowDefaultPath: 'isUsableOnce',
      condition: (row) => isId(row, 'TemporaryAccessPass'),
    },
    {
      type: 'number',
      name: 'TAPMinimumLifetime',
      label: 'Minimum lifetime (minutes)',
      rowDefaultPath: 'minimumLifetimeInMinutes',
      condition: (row) => isId(row, 'TemporaryAccessPass'),
    },
    {
      type: 'number',
      name: 'TAPMaximumLifetime',
      label: 'Maximum lifetime (minutes)',
      rowDefaultPath: 'maximumLifetimeInMinutes',
      condition: (row) => isId(row, 'TemporaryAccessPass'),
    },
    {
      type: 'number',
      name: 'TAPDefaultLifeTime',
      label: 'Default lifetime (minutes)',
      rowDefaultPath: 'defaultLifetimeInMinutes',
      condition: (row) => isId(row, 'TemporaryAccessPass'),
    },
    {
      type: 'number',
      name: 'TAPDefaultLength',
      label: 'Default length (characters)',
      rowDefaultPath: 'defaultLength',
      condition: (row) => isId(row, 'TemporaryAccessPass'),
    },

    // Microsoft Authenticator
    {
      type: 'switch',
      name: 'MicrosoftAuthenticatorSoftwareOathEnabled',
      label: 'Allow software OATH tokens',
      rowDefaultPath: 'isSoftwareOathEnabled',
      condition: (row) => isId(row, 'MicrosoftAuthenticator'),
    },
    {
      type: 'select',
      name: 'MicrosoftAuthenticatorDisplayAppInfo',
      label: 'Show application name in push and passwordless notifications',
      creatable: false,
      options: tristateOptions,
      rowDefaultPath: 'featureSettings.displayAppInformationRequiredState.state',
      condition: (row) => isId(row, 'MicrosoftAuthenticator'),
    },
    {
      type: 'select',
      name: 'MicrosoftAuthenticatorDisplayLocation',
      label: 'Show geographic location in push and passwordless notifications',
      creatable: false,
      options: tristateOptions,
      rowDefaultPath: 'featureSettings.displayLocationInformationRequiredState.state',
      condition: (row) => isId(row, 'MicrosoftAuthenticator'),
    },
    {
      type: 'select',
      name: 'MicrosoftAuthenticatorCompanionApp',
      label: 'Companion app allowed state',
      creatable: false,
      options: tristateOptions,
      rowDefaultPath: 'featureSettings.companionAppAllowedState.state',
      condition: (row) => isId(row, 'MicrosoftAuthenticator'),
    },

    // Email OTP
    {
      type: 'select',
      name: 'EmailAllowExternalIdToUseEmailOtp',
      label: 'Allow external users to use Email OTP',
      creatable: false,
      options: tristateOptions,
      rowDefaultPath: 'allowExternalIdToUseEmailOtp',
      condition: (row) => isId(row, 'Email'),
    },
    {
      type: 'autoComplete',
      name: 'EmailExcludeGroupIds',
      label: 'Exclude group(s)',
      multiple: true,
      creatable: false,
      rowDefaultPath: 'excludeTargets',
      api: groupFieldApi,
      condition: (row) => isId(row, 'Email'),
    },

    // QR Code PIN
    {
      type: 'number',
      name: 'QRCodeLifetimeInDays',
      label: 'Standard QR code lifetime (days, 1-395)',
      rowDefaultPath: 'standardQRCodeLifetimeInDays',
      condition: (row) => isId(row, 'QRCodePin'),
    },
    {
      type: 'number',
      name: 'QRCodePinLength',
      label: 'PIN length (8-20)',
      rowDefaultPath: 'pinLength',
      condition: (row) => isId(row, 'QRCodePin'),
    },

    // FIDO2
    {
      type: 'switch',
      name: 'FIDO2AttestationEnforced',
      label: 'Enforce attestation',
      rowDefaultPath: 'isAttestationEnforced',
      condition: (row) => isId(row, 'Fido2'),
    },
    {
      type: 'switch',
      name: 'FIDO2SelfServiceRegistration',
      label: 'Allow self-service registration',
      rowDefaultPath: 'isSelfServiceRegistrationAllowed',
      condition: (row) => isId(row, 'Fido2'),
    },

    // Voice call
    {
      type: 'switch',
      name: 'VoiceIsOfficePhoneAllowed',
      label: 'Allow office phone registration',
      rowDefaultPath: 'isOfficePhoneAllowed',
      condition: (row) => isId(row, 'Voice'),
    },

    // SMS (isUsableForSignIn lives on each include-target)
    {
      type: 'switch',
      name: 'SmsIsUsableForSignIn',
      label: 'Use for sign-in',
      rowDefaultPath: 'includeTargets.0.isUsableForSignIn',
      condition: (row) => isId(row, 'SMS'),
    },
  ]

  // Build the POST body for the selected method by coercing each visible field by its type.
  // Field names match the backend parameter names, so configFields is the single source of truth.
  const buildConfigBody = (row, formData) => {
    const body = {
      tenantFilter: tenant === 'AllTenants' && row?.Tenant ? row.Tenant : tenant,
      id: row?.id,
      state: row?.state,
    }
    configFields
      .filter((field) => field.condition(row))
      .forEach((field) => {
        const value = formData?.[field.name]
        if (field.type === 'switch') {
          body[field.name] = !!value
        } else if (field.type === 'number') {
          body[field.name] = num(value)
        } else if (field.type === 'autoComplete') {
          body[field.name] = Array.isArray(value)
            ? value.map((item) => item.value).filter(Boolean)
            : []
        } else {
          body[field.name] = value // select / scalar — undefined is dropped by JSON
        }
      })
    return body
  }

  const actions = [
    {
      label: 'Enable Policy',
      type: 'POST',
      icon: <Check />,
      url: '/api/SetAuthMethod',
      data: { state: '!enabled', id: 'id' },
      confirmText: 'Are you sure you want to enable this policy?',
      multiPost: false,
      category: "edit",
    },
    {
      label: 'Disable Policy',
      type: 'POST',
      icon: <Block />,
      url: '/api/SetAuthMethod',
      data: { state: '!disabled', id: 'id' },
      confirmText: 'Are you sure you want to disable this policy?',
      multiPost: false,
      category: "edit",
    },
    {
      label: 'Deploy to Custom Group',
      type: 'POST',
      icon: <UserGroupIcon />,
      url: '/api/SetAuthMethod',
      confirmText: 'Select one or more groups for "[id]".',
      fields: [
        {
          type: 'autoComplete',
          name: 'groupTargets',
          label: 'Group(s)',
          multiple: true,
          creatable: false,
          allowResubmit: true,
          validators: { required: 'Please select at least one group' },
          api: groupFieldApi,
        },
      ],
      customDataformatter: (row, action, formData) => {
        const selectedGroups = Array.isArray(formData?.groupTargets) ? formData.groupTargets : []
        return {
          tenantFilter: tenant === 'AllTenants' && row?.Tenant ? row.Tenant : tenant,
          state: row?.state,
          id: row?.id,
          GroupIds: selectedGroups.map((group) => group.value).filter(Boolean),
        }
      },
      multiPost: false,
      category: "manage",
    },
    {
      label: 'Assign to All Users',
      type: 'POST',
      icon: <Public />,
      url: '/api/SetAuthMethod',
      hideBulk: true,
      confirmText: 'Are you sure you want to scope "[id]" to all users?',
      customDataformatter: (row) => ({
        tenantFilter: tenant === 'AllTenants' && row?.Tenant ? row.Tenant : tenant,
        state: row?.state,
        id: row?.id,
        GroupIds: ['all_users'],
      }),
      multiPost: false,
    },
    {
      label: 'Configure',
      type: 'POST',
      icon: <Settings />,
      url: '/api/SetAuthMethod',
      hideBulk: true,
      condition: (row) => row?.state === 'enabled' && configurableMethods.some((m) => isId(row, m)),
      setDefaultValues: true,
      confirmText: 'Configure authentication method settings.',
      fields: configFields,
      customDataformatter: (row, action, formData) => buildConfigBody(row, formData),
      multiPost: false,
    },
  ]

  const offCanvas = {
    extendedInfoFields: ['id', 'displayName', 'state', 'includeTargets', 'excludeTargets'],
    actions: actions,
  }

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl={apiUrl}
      apiData={{
        Endpoint: 'authenticationMethodsPolicy',
      }}
      apiDataKey="Results.0.authenticationMethodConfigurations"
      simpleColumns={simpleColumns}
      offCanvas={offCanvas}
      actions={actions}
      dynamicColumns={false}
    />
  )
}

// Adding the layout for the dashboard
Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
