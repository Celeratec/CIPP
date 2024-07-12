import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CHeaderNav,
  CImage,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
} from '@coreui/react'
import { AppSidebarNav } from 'src/components/layout'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import navigation from 'src/_nav'
import { useAuthCheck } from '../utilities/CippauthCheck'
import routes from 'src/routes'
import { useRouteNavCompare } from 'src/hooks/useRouteNavCompare'
import { useNavFavouriteCheck } from 'src/hooks/useNavFavouriteCheck'

// Import the new image
import CippLogo from 'src/assets/images/CIPP.png'

const AppSidebar = () => {
  return (
    <CSidebar>
      <CSidebarBrand className="d-none d-md-flex">
        <CImage
          src={CippLogo} // Use the imported image here
          height={35}
          width={170}
          alt="CIPP Logo"
        />
        <CCloseButton className="d-md-none" />
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={navigation} />
        </SimpleBar>
      </CSidebarNav>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
